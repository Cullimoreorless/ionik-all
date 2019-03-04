import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  form: FormGroup = this.fb.group({
    username: [''],
    password:['']
  })

  constructor(private fb : FormBuilder) { 
    
  }

  ngOnInit() {
  }

}
