import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {Observable} from 'rxjs'

@Injectable()
export class AuthInterceptor implements HttpInterceptor{
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let token = localStorage.getItem('siamo_tkn');
    if(token){
      let clonedReq = req.clone({
        headers: req.headers.set("Authorization", "Bearer " + token)
      });
      return next.handle(clonedReq)
    }
    else{
      return next.handle(req);
    }
  }
}