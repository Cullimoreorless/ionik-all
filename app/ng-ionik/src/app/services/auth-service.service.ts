import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  login(credentials: any){
    return this.http.post('/api/auth/authenticate', credentials)
      .pipe(tap(res => this.setSession(res)), shareReplay())
  }

  private setSession(result){
    console.log('SESSION SETTING')
    let expiresAt = moment().add(result.expiresIn, 'second')
    localStorage.setItem('siamo_tkn',result.tkn)
    localStorage.setItem('expires_at',JSON.stringify(expiresAt.valueOf()))
    return (result && result.tkn);
  }

  register(username:string, 
      password:string, 
      confirmPassword: string, params : any){
    return this.http.post<any>('/api/auth/registerUser',{
      username, password, confirmPassword
    });
  }

  isLoggedIn(){
    return moment().isBefore(this.getExpiration())
  }

  logout(){
    localStorage.removeItem("id_token");
    localStorage.removeItem("expires_at");
  }

  getExpiration(){
    let expiration = localStorage.getItem("expires_at");
    let expiresAt = JSON.parse(expiration);
    return moment(expiresAt);
  }
}
