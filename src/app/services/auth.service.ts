import { Injectable, NgZone } from '@angular/core';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from "angularfire2/auth";
import { Router } from "@angular/router";
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/take';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { AngularFirestore, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';
import { User } from '../models/user';



@Injectable({
  providedIn: 'root'
})

export class AuthService {
  roles:string;
  user$: BehaviorSubject<User> = new BehaviorSubject(null);
 
  userData: any
  constructor(
    public afAuth: AngularFireAuth, // Inject Firebase auth service
    public afs: AngularFirestore,
    public router: Router,
    public ngZone: NgZone // NgZone service to remove outside scope warning
  ) {
   //// Get auth data, then get firestore user document || null
   this.afAuth.authState
   .switchMap(user => {
     if (user) {
       return this.afs.doc<User>(`users/${user.uid}`).valueChanges()
     } else {
       return Observable.of(null)
     }
   })
   .subscribe(user=>{
    if (user) {
      this.user$.next(user)      
      console.log(user)
      this.userData=user
      localStorage.setItem('user', JSON.stringify(this.userData));
      JSON.parse(localStorage.getItem('user')|| '{}');
    } else {
      localStorage.setItem('user', null);
      JSON.parse(localStorage.getItem('user'));
    }
   }
              

   )

  }

  // Sign up with email/password
  SignUp(email, password) {
    return this.afAuth.auth.createUserWithEmailAndPassword(email, password)
      .then(() => {
        /* Call the SendVerificaitonMail() function when new user sign 
        up and returns promise */
        this.sendEmailVerification();
        // this.setUserData(result.user);
      }).catch((error) => {
        window.alert(error.message)
      })
  }

  // Send email verfificaiton when new user sign up
  sendEmailVerification() {
    return this.afAuth.auth.currentUser!.sendEmailVerification()
      .then(() => {
        this.router.navigate(['verify-email']);
      })
  }

  // Reset Forggot password
  ForgotPassword(passwordResetEmail) {
    return this.afAuth.auth.sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        window.alert('Password reset email sent, check your inbox.');
      }).catch((error) => {
        window.alert(error)
      })
  }

  // Returns true when user is looged in and email is verified
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || "{}");
    return (user !== null && user.emailVerified !== false && user.roles.admin !==false) ? true : false;
  }


  // Auth logic to run auth providers
  AuthLogin() {
    const provider= new firebase.auth.GoogleAuthProvider()
    return this.afAuth.auth.signInWithPopup(provider)
    .then((result) => {
      this.ngZone.run(() => {
         this.router.navigate(['dashboard']);
       })
     this.updateUserData(result.user);
   }).catch((error) => {
     window.alert(error)
   })
  }
  

  // Sign out 
  SignOut() {
    return this.afAuth.auth.signOut().then(() => {

      localStorage.setItem('user', null);
      this.router.navigate(['login']);
      window.alert("user logged out!!")

    })

  }
  
  private updateUserData(user) {
    // Sets user data to firestore on login
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
    const data: User = {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,

      roles: {
        reader: true
      }
    }
    return userRef.set(data, { merge: true })
  }
}

