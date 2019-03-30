import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '@/services/auth-service.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'register-user',
  templateUrl: './register-user.component.html',
  styleUrls: ['./register-user.component.css']
})
export class RegisterUserComponent implements OnInit {
  form: FormGroup 
  companies: any
  constructor(private fb : FormBuilder,
      private authService : AuthService,
      private http : HttpClient ) {
    this.form = this.fb.group({
      username: ['',Validators.required],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      companyId: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.http.get('/api/company/all').subscribe((resCompanies) => {
      this.companies = resCompanies;
    })
  }

  registerUser(){
    this.http.post('/api/auth/registerUser', this.form.value).subscribe((res)=>{
      console.log(res);
    });
  }

}
