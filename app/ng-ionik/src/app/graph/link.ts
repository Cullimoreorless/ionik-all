import {Node } from './node'

export class Link implements d3.SimulationLinkDatum<Node>{
  id?: number
  source: Node | string | number
  target: Node | string | number
  type:string
  normalizedweight:number
  index?:number
  
  constructor(source, target){
    this.source = source;
    this.target = target;
  }
}
