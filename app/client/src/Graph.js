import React, {Component} from 'react';

import { linkDistance,forceSimulation, forceCenter, forceLink, forceX, forceY,
  minDistance, maxDistance} from 'd3-force'

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

  

  linkArc(d){
    var dx = d.target.x - d.source.x,
    dy = d.target.y - d.source.y,
    dr = Math.sqrt(dx * dx + dy * dy),
    plusdr = dr;
    if(d.type === "OutsideOfWork"){
      plusdr = dr + 100;
    }
    return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + plusdr + " 0 0,1 " + d.target.x + "," + d.target.y;
  }

  transform(d){
    return "translate(" + d.x + "," + d.y + ")";
  }
  
  // sim;

  // componentDidUpdate(){
  //   this.getDataFromDB();
  // }
  
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
        var colorCategory = {};
        var colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    
        preNodes.forEach(node => {
          nodes[node.id] = node; 
          if(colorCategory[node.location || "nonegiven"] == null){
            colorCategory[node.location || "nonegiven"] = colorIndex++;
            console.log(colorScale(colorIndex));
          }
        }); 

        links.forEach(link => {
          link.source = nodes[link.source] || (nodes[link.source] = preNodes[link.source]);
          link.target = nodes[link.target] || (nodes[link.target] = preNodes[link.target]);    
        })

        let sim = d3.forceSimulation(d3.values(nodes))
          .force("link",
            d3.forceLink().distance(200).links(links)
          )
          .force("x", d3.forceX(this.width / 2))
          .force("y", d3.forceY(this.height / 2));

        var path = svg.append("g").selectAll("path")
          .data(links)
          .enter().append("path")
          .attr("class", function(d) { return "link " + d.type; })
          .attr("style",function(d){return `stroke-width:${d.normalizedweight}px`})
          .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });
        

        var text = svg.append("g").selectAll("text")
            .data(sim.nodes())
          .enter().append("text")
            .attr("x", 8)
            .attr("y", ".35em")
            .text(function(d) { return d.name; });  

        // console.log(colorCategory);
        // console.log(colorScale)
        // console.log(d3.values(nodes));
        let colors = {
          "0":"#000",
          "1":"#FFF",
          "2":"#CCC",
          "3":"#888"
        }
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
        var circle = svg.append("g").selectAll("circle")
             .data(sim.nodes())
               .enter()
            .append("circle")
             .attr("r", function(d) { return d.normalizedweight;})
             .style("fill",function(d) {
               return colors[colorCategory[d.location ||"nonegiven"]]
             })
             .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));
            // .style("fill",function(d) { console.log(colorScale(colorCategory[d.location || "nonegiven"]));
            //       return colorScale(colorCategory[d.location || "nonegiven"]);})
            // .call(sim.drag);
        console.log(circle);
        // Use elliptical arc path segments to doubly-encode directionality.
        let tick = ()=> {
          path.attr("d", this.linkArc);
          circle.attr("transform", this.transform);
          text.attr("transform", this.transform);
          
        };

        sim.on('tick',tick);

        

          
  
  
       
    //   this.force = d3.forceSimulation(d3.values(nodes))
    //   .force("link",
    //     d3.forceLink().distance(200).links(links)
    //   )
    //   .force("x", d3.forceX(this.width / 2))
    //   .force("y", d3.forceY(this.height / 2));

    // this.force.on('tick', () => this.setState({
    //   data:res,
    // 	links:links,
    // 	nodes: d3.values(nodes)
    // }));
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
          plusdr = dr - 50;
        }
        d.transform =  "M" + d.source.x + "," + d.source.y + "A" + plusdr + "," + plusdr + " 0 0,1 " + d.target.x + "," + d.target.y;
      
    })
    const width = this.width;
    const height = this.height
    return <div>
      <h1>New Component</h1>
      <svg ref={node => this.node = node}
      width={width} height={height}>
        {/* <g>
          {links.map((link, index) => (
            
            <path className={"link " + link.type} 
              style={{strokeWidth:  link.normalizedweight+"px"}}
              d={link.transform}
              key={"link-"+index}
              />
          ))}
        </g>
        <g>
          {this.state.nodes.map((node, index) => (
            
            [<circle r={node.normalizedweight} 
              transform={"translate("+ node.x + ", " + node.y+ ")"} 
              key={"circle-" + index}></circle>,
            <text 
              x="0" y=".35em"
              transform={"translate("+ (node.x + node.normalizedweight) + ", " + node.y+ ")"}
              key={"text"+index}>
              {node.name}
              </text>]
          ))}
        </g> */}
      </svg>
    </div>
  }
}

export default Graph