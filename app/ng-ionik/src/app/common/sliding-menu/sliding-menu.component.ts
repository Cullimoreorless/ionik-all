import { Component, OnInit, Output,
 EventEmitter } from '@angular/core';
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
  @Output() params : EventEmitter<GraphFilters> = new EventEmitter();
  
  showMenu=false;
  graphParams : GraphFilters = new GraphFilters();
  constructor() { 
  }

  ngOnInit() {
  }

  toggleMenu(){
    this.showMenu = !this.showMenu;
  }

  sendValues(){
    this.params.emit(this.graphParams);
  }

}
