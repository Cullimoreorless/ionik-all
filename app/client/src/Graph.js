import React, {Component} from 'react';

import { linkDistance,forceSimulation, forceCenter, forceLink, forceX, forceY} from 'd3-force'

let d3 = require('d3')

class Graph extends Component{
  state = {
    data:null,
    links:[],
    nodes:[]
  }
  width=960;
  height=500;

  constructor(props){
    super(props)
    this.width = 960;
    this.height = 500;
  }

  componentDidMount(){
    this.getDataFromDB();
  }

  
  getDataFromDB(){
    fetch("/molecule/getGraphData")
      .then(data => data.json())
      .then(res => {
        const svg = d3.select(this.node);
        svg.attr("width",this.width)
          .attr("height",this.height);

        let links = res.links;
        let preNodes = res.nodes;
        let nodes = {}
        let colorIndex = 0;
        let colorCategory = {};
        let colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    
        preNodes.forEach(node => {
          nodes[node.id] = node; 
          if(colorCategory[node.location] == null){
            colorCategory[node.location] = colorIndex++;
            console.log(colorScale(colorIndex));
          }
        }); 

        links.forEach(link => {
          link.source = nodes[link.source] || (nodes[link.source] = preNodes[link.source]);
          link.target = nodes[link.target] || (nodes[link.target] = preNodes[link.target]);    
        })
        // Use elliptical arc path segments to doubly-encode directionality.
        // let tick = ()=> {
        //   path.attr("d", linkArc);
        //   circle.attr("transform", transform);
        //   text.attr("transform", transform);
        // };

        // let linkArc =(d) => {
        //   var dx = d.target.x - d.source.x,
        //       dy = d.target.y - d.source.y,
        //       dr = Math.sqrt(dx * dx + dy * dy),
        //       plusdr = dr;
        //   if(d.type === "OutsideOfWork"){
        //     plusdr = dr + 100;
        //   }
        //   return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + plusdr + " 0 0,1 " + d.target.x + "," + d.target.y;
        // };

        // let transform = (d) => {
        //   return "translate(" + d.x + "," + d.y + ")";
        // };


        // var sim = d3.forceSimulation(d3.values(nodes))
        //   .force('link',d3.forceLink(links))
        //   .force('center',d3.forceCenter())
        //   ; 

          
      //   //sim.size([this.width, this.height])
      //     // .linkDistance(200)
      //     // .charge(-300)
      //     sim.on("tick", tick)
      //     // .start();
        
      //   svg.append("defs").selectAll("marker")
      //     .data(["OutsideOfWork","RegularHours"])
      //     .enter().append("marker")
      //     .attr("id",function(d){ return d;})
      //     .attr("viewBox","0 -5 10 10")
      //     .attr("refX",15)
      //     .attr("refY",-1.5)
      //     .attr("markerWidth", 6)
      //     .attr("markerHeight", 6)
      //     .attr("orient", "auto")
      //   .append("path")
      //     .attr("d", "M0,-5L10,0L0,5");

      //     var path = svg.append("g").selectAll("path")
      //     .data(sim.links())
      //   .enter().append("path")
      //     .attr("class", function(d) { return "link " + d.type; })
      //     .attr("style",function(d){return `stroke-width:${d.normalizedweight}px`})
      //     .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });
  
      // var circle = svg.append("g").selectAll("circle")
      //     .data(sim.nodes())
      //   .enter().append("circle")
      //     .attr("r", function(d) { return d.normalizedweight;})
      //     .style("fill",function(d) { console.log(colorScale(colorCategory[d.location]));
      //           return colorScale(colorCategory[d.location]);})
      //     .call(sim.drag);
  
      // var text = svg.append("g").selectAll("text")
      //     .data(sim.nodes())
      //   .enter().append("text")
      //     .attr("x", 8)
      //     .attr("y", ".35em")
      //     .text(function(d) { return d.name; });
  
       
      this.force = d3.forceSimulation(d3.values(nodes))
      .force("link",
        d3.forceLink().distance(200).links(links)
      )
      .force("x", d3.forceX(this.width / 2))
      .force("y", d3.forceY(this.height / 2));

    this.force.on('tick', () => this.setState({
      data:res,
    	links:links,
    	nodes: d3.values(nodes)
    }));
        // this.setState({data:res, nodes:res.nodes, links:res.links}) 
      } )
  }

  render(){
    const {data } = this.state;
    let links = this.state.links;
    links.forEach((d) => {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy),
            plusdr = dr;
        if(d.type === "OutsideOfWork"){
          plusdr = dr + 100;
        }
        d.transform =  "M" + d.source.x + "," + d.source.y + "A" + dr + "," + plusdr + " 0 0,1 " + d.target.x + "," + d.target.y;
      
    })
    const width = this.width;
    const height = this.height
    return <div>
      <h1>New Component</h1>
      {JSON.stringify(data)}
      <svg ref={node => this.node = node}
      width={width} height={height}>
        <g>
          {this.state.nodes.map((node, index) => (
            <circle r={node.normalizedweight} 
              transform={"translate("+ node.x + ", " + node.y+ ")"} 
              key={"circle-" + index}/>
          ))}
        </g>
        <g>
          {links.map((link, index) => (
            
            <path className={"link " + link.type} 
              style={{strokeWidth:  link.normalizedweight+"px"}}
              d={link.transform}
              key={"link-"+index}
              />
          ))}
        </g>
      </svg>
    </div>
  }
}

export default Graph