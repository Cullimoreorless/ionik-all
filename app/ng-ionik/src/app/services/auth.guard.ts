import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth-service.service';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router){

  }
  canActivate():boolean{
    var result =  this.auth.isLoggedIn();
    if(!result){
      this.router.navigate(['/login'])
    }
    return result;
  }

}