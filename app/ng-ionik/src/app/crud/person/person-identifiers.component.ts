import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Component({
  selector:'person-identifiers',
  templateUrl:'./person-identifiers.component.html',
  styleUrls:['./person-identifiers.component.css']
})
export class PersonIdentifiersComponent implements OnInit{

  constructor(private http: HttpClient){}

  ngOnInit(){
    this.http.get('/api/company/listCompanyIntegrations').subscribe((integrations) =>{
      console.log(integrations)
    })
  }
}