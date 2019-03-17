import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css']
})
export class CompanyComponent implements OnInit {

  //lowercase used for crud to allow for easy insertion/retreival
  form: FormGroup = this.fb.group({
    companyid:[''],
    companycode:[''],
    companyname:['']
  });

  constructor(private fb: FormBuilder, private http: HttpClient) { }

  ngOnInit() { 
  }

  saveCompany(){
    console.log(this.form.value)
    let x =  this.http.post("/api/company/saveCompany", this.form.value);
    x.subscribe((next) => {
      this.form.setValue(next);
    })
  }

}
