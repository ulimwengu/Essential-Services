export interface Roles {
    reader: boolean;
    admin?: boolean;
}

export class User {
    email: string;
    emailVerified: boolean;
    uid: string;
    roles: Roles    
   
}