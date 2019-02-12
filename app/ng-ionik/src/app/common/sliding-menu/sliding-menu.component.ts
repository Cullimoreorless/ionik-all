import { Component, OnInit } from '@angular/core';
import { trigger, transition,
          animate, style } from '@angular/animations';
import { GraphFilters } from 'src/app/graph-filters';



@Component({
  selector: 'sliding-menu',
  templateUrl: './sliding-menu.component.html',
  styleUrls: ['./sliding-menu.component.css'],
  animations:[
    trigger('slideInOut', [
      transition(':enter',[
        style({transform:'translateY(-100%)'}),
        animate('200ms ease-in', style({transform: 'translateY(0%)'}))
      ]),
      transition(':leave',[
        animate('200ms ease-out', style({transform:'translateY(-100%)'}))
      ])
    ])
  ]
})
export class SlidingMenuComponent implements OnInit {
  showMenu=false;
  graphParams : GraphFilters = new GraphFilters();
  constructor() { 
    let now = new Date();
    let prev = new Date();
    
    this.graphParams.startDate = '7/1/2018';
    this.graphParams.endDate = now.toLocaleDateString();
    this.graphParams.threshold = 10;
  }

  ngOnInit() {
  }

  toggleMenu(){
    this.showMenu = !this.showMenu;
  }

}
