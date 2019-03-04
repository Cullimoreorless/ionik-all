import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '@/services/auth-service.service';

@Component({
  selector: 'register-user',
  templateUrl: './register-user.component.html',
  styleUrls: ['./register-user.component.css']
})
export class RegisterUserComponent implements OnInit {
  form: FormGroup
  constructor(private fb : FormBuilder,
      private authService : AuthService ) {
    this.form = this.fb.group({
      username: ['',Validators.required],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    });
  }

  ngOnInit() { 
  }

  register(){
    console.log(this.form.value)
  }

}
