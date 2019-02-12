import { Component, OnInit, Input, ChangeDetectorRef,
  ChangeDetectionStrategy, 
  ViewChild,
  ElementRef} from '@angular/core';
import { Node } from './node';
import { Link } from './link';
import { GraphSimulation } from './graph-simulation';
import { GraphService } from './graph.service';
import { GlobalsService} from '../globals.service';
import { debounceTime } from 'rxjs/operators'
import { fromEvent, Subscription, Observable } from 'rxjs';
import * as d3 from 'd3';
import { GraphFilters } from '../graph-filters';
//ng serve -o --proxy-config proxy.conf.json

@Component({
  selector: 'app-graph',
  changeDetection:ChangeDetectionStrategy.OnPush,
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css']
})
export class GraphComponent implements OnInit {
  @ViewChild('graphSVG') graphSVG : ElementRef;
  @ViewChild('gContainer') graphContainer : ElementRef;
  nodes : Node[] =[]; 
  links : Link[] = [];
  graphData$: Observable<Object>;
  graphData: {nodes:Node[],links:Link[]}
  graph: GraphSimulation;

  colorArray:string[];

  graphFilters : GraphFilters = new GraphFilters();

  resizeObservable$:Observable<Event>;
  resizeSubscription$:Subscription

  private _options : {width, height} = {width:900,height:600};
  constructor(private graphService: GraphService, 
              private GLOBALS: GlobalsService, private ref:ChangeDetectorRef) { 
    let now = new Date();
  }

  ngOnInit(){
    this.resizeObservable$ = fromEvent(window,'resize')
    this.resizeSubscription$ = this.resizeObservable$.pipe(debounceTime(1000)).subscribe(evt =>{
      console.log(window.outerWidth)
    });
  }

  ngOnDestroy(){
    this.resizeSubscription$.unsubscribe();
  }

  ngAfterContentInit() {
    this.getGraph();

    // this.graph.ticker.subscribe((d) => {
    //   this.ref.markForCheck();
    // })
  }

  ngAfterViewInit(){
  }


  getParams(event){
    this.graphFilters = event;
    this.refreshGraph();
  }

  refreshGraph(){
    // this.graphSVG.nativeElement.empty()
    this.getGraph();
  }

  getGraph(){
    this.graphData$ = this.graphService.getGraphData(this.graphFilters);
    this.graphData$.subscribe((data : {nodes:Node[],links:Link[]} ) =>{
      this.graphData = data;
      this.nodes = this.graphData.nodes;
      this.links = this.graphData.links;
      
      this.colorArray = this.nodes.reduce((acc, curr) =>{
        if(!(curr.location in acc)){
          acc.push(curr.location)
        }
        return acc;
      },[]);
      
      this.drawGraph();
      // this.graph = this.graphService.getForceGraph(this.nodes, this.links, this._options)
      // this.graph.initSimulation(this._options)
    })
  }

  resizeWindow(event){
    console.log(this.graphContainer.nativeElement.width);
  }

  drawGraph(){
    let colorScale = this.getColorTransform();
    let colorArrayLocal = this.colorArray;
    let svg = d3.select(this.graphSVG.nativeElement)
    svg.selectAll('*').remove();

    this.links.forEach(link => {
      link.source = this.nodes.find(n => n.id == link.source);
      link.target = this.nodes.find(n => n.id == link.target);    
    })
    
    let sim = d3.forceSimulation(this.nodes)
      .force('link',d3.forceLink().distance(200).links(this.links))
      .force('charge', d3.forceManyBody())
      .force('collision', d3.forceCollide().radius(function(d:any) {return d.normalizedweight + 10;}))
      .force('x', d3.forceX(this._options.width / 2))
      .force('y', d3.forceY(this._options.height /2));

    var path = svg.append('g').selectAll('path')
      .data(this.links)
      .enter().append('path')
      .attr('class', function(d) { return 'link ' + d.type; })
      .attr('style',function(d) {return `stroke-width:${d.normalizedweight}px`})
      .attr('marker-end', function(d) { return 'url(#' + d.type + ')'; });
    

    var text = svg.append('g').selectAll('text')
        .data(sim.nodes())
      .enter().append('text')
        .attr('x', function(d){return 3 + d.normalizedweight})
        .attr('y', '.35em')
        .text(function(d) { return d.name; });  

    function dragstarted(d) {
      if (!d3.event.active) sim.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
  
    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }
  
    function dragended(d) {
      if (!d3.event.active) sim.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    var circle =
      svg.append('g').selectAll('circle')
        .data(sim.nodes())
        .enter()
          .append('circle')
          .attr('r', function(d) { return d.normalizedweight;})
          .style('fill',function(d){return colorScale(colorArrayLocal.findIndex(el => el == d.location))})
          .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended));
    
    let tick = ()=> {
      path.attr('d', this.linkArc);
      circle.attr('transform', this.transform);
      text.attr('transform', this.transform);
      
    };

    sim.on('tick',tick);
  }

  linkArc(d){
    var dx = d.target.x - d.source.x,
    dy = d.target.y - d.source.y,
    dr = Math.sqrt(dx * dx + dy * dy),
    plusdr = dr;
    if(d.type === 'OutsideOfWork'){
      plusdr = dr + 100;
    }
    return 'M' + d.source.x + ',' + d.source.y + 'A' + dr + ',' + plusdr + ' 0 0,1 ' + d.target.x + ',' + d.target.y;
  }

  transform(d){
    return 'translate(' + d.x + ',' + d.y + ')';
  }

  getColorTransform(){
    let domainLength = this.colorArray.length;
    let colorRange = [d3.rgb(this.GLOBALS.coolDark),
                d3.rgb(this.GLOBALS.warmDark)]
    return d3.scaleLinear()
      .domain([0,domainLength-1])
      .range(colorRange)
      .interpolate(d3.interpolateHcl)//pull these values from highs and lows on styles.css

  }


  get options() {
    return this._options = {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

}
