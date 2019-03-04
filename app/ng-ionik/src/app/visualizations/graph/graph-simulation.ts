import { EventEmitter } from '@angular/core';
import { Link } from './link';
import { Node } from './node';
import * as d3 from 'd3';

export class GraphSimulation {
  public ticker : EventEmitter<d3.Simulation<Node,Link>> = new EventEmitter();
  public simulation : d3.Simulation<any,any>;

  public nodes : Node[] = [];
  public links : Link[] = [];

  constructor(nodes: Node[], links:Link[], options : { width, height }){
    this.nodes = nodes;
    this.links = links;

    this.initSimulation(options);
  }

  initNodes(){
    if(!this.simulation){
      throw new Error("initNodes - Graph simulation not yet initiated")
    }
    this.simulation.nodes(this.nodes);
  }

  initLinks(){
    if(!this.simulation){
      throw new Error("initLinks - Graph simulation not yet initiated")
    }

    this.simulation.force('links', d3.forceLink(this.links).strength(-30))

  }

  initSimulation(options:{width, height}){
    if(!options){
      options = {width:900, height:600}
    }
    if(!options.width){
      options.width = 900
    }
    if(!options.height){
      options.height = 600
    }

    if(!this.simulation){
      const ticker = this.ticker;
      this.simulation = d3.forceSimulation()
        .force("charge", d3.forceManyBody());
      
      this.simulation.on('tick', function(){
        ticker.emit(this);
      });

      this.initNodes();
      this.initLinks();

    }

    this.simulation.force('centers', d3.forceCenter(options.width/2, options.height/2));
    this.simulation.restart();
    
  }

}
