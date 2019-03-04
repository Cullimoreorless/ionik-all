import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  login(username:string, password: string) : Observable<any>{
    return this.http.post<any>('/api/authenticate', {
      username, password
    });
  }

  register(username:string, 
      password:string, 
      confirmPassword: string, params : any){
    return this.http.post<any>('/api/registerUser',{
      username, password, confirmPassword
    })
  }

  logout(){
    
  }
}
