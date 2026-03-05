"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import { MeasurementData, COORDINATES } from "@/lib/api";

interface LatencyMapProps {
  measurements: MeasurementData[];
}

// Color scale: green (low latency) → yellow → red (high latency)
function latencyColor(ms: number): string {
  if (ms <= 0) return "#ef4444";   // error/timeout = red
  if (ms < 20) return "#22c55e";   // excellent = green
  if (ms < 50) return "#84cc16";   // good = lime
  if (ms < 100) return "#eab308";  // okay = yellow
  if (ms < 200) return "#f97316";  // slow = orange
  return "#ef4444";                // bad = red
}

function statusEmoji(status: string): string {
  return status === "SUCCESS" ? "✓" : "✗";
}

export default function LatencyMap({ measurements }: LatencyMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    svg.selectAll("*").remove();

    // Dark background
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#0a0e1a");

    // Globe projection
    const projection = d3
      .geoNaturalEarth1()
      .scale(width / 5.5)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Fetch world map data
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((res) => res.json())
      .then((world) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const countries = feature(world, world.objects.countries) as any;

        // Graticule (grid lines)
        const graticule = d3.geoGraticule();
        svg
          .append("path")
          .datum(graticule())
          .attr("d", path)
          .attr("fill", "none")
          .attr("stroke", "#1a2040")
          .attr("stroke-width", 0.4);

        // Globe outline
        svg
          .append("path")
          .datum({ type: "Sphere" } as d3.GeoPermissibleObjects)
          .attr("d", path)
          .attr("fill", "none")
          .attr("stroke", "#2a3a6a")
          .attr("stroke-width", 1);

        // Countries
        svg
          .selectAll(".country")
          .data(countries.features)
          .enter()
          .append("path")
          .attr("class", "country")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .attr("d", path as any)
          .attr("fill", "#141c30")
          .attr("stroke", "#2a3a6a")
          .attr("stroke-width", 0.5);

        // Draw measurement arcs
        const tooltip = d3.select(tooltipRef.current);

        // Group measurements by unique source-target pair, keep latest
        const latestByPair = new Map<string, MeasurementData>();
        measurements.forEach((m) => {
          const key = `${m.sourceRegion}-${m.targetRegion || m.targetHost}`;
          const existing = latestByPair.get(key);
          if (!existing || m.measuredAt > existing.measuredAt) {
            latestByPair.set(key, m);
          }
        });

        const uniqueMeasurements = Array.from(latestByPair.values());

        uniqueMeasurements.forEach((m) => {
          const sourceCoord = COORDINATES[m.sourceRegion];
          const targetKey = m.targetRegion || m.targetHost;
          const targetCoord = COORDINATES[targetKey];

          if (!sourceCoord || !targetCoord) return;

          const sourceProjected = projection(sourceCoord.toReversed() as [number, number]);
          const targetProjected = projection(targetCoord.toReversed() as [number, number]);

          if (!sourceProjected || !targetProjected) return;

          const color = latencyColor(m.latencyMs);

          // Glow filter for arcs
          const defs = svg.append("defs");
          const filterId = `glow-${m.id}`;
          const filter = defs
            .append("filter")
            .attr("id", filterId)
            .attr("x", "-50%")
            .attr("y", "-50%")
            .attr("width", "200%")
            .attr("height", "200%");
          filter
            .append("feGaussianBlur")
            .attr("stdDeviation", "3")
            .attr("result", "coloredBlur");
          const feMerge = filter.append("feMerge");
          feMerge.append("feMergeNode").attr("in", "coloredBlur");
          feMerge.append("feMergeNode").attr("in", "SourceGraphic");

          // Curved arc between source and target
          const dx = targetProjected[0] - sourceProjected[0];
          const dy = targetProjected[1] - sourceProjected[1];
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;

          svg
            .append("path")
            .attr(
              "d",
              `M${sourceProjected[0]},${sourceProjected[1]}A${dr},${dr} 0 0,1 ${targetProjected[0]},${targetProjected[1]}`
            )
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 2)
            .attr("stroke-opacity", 0.7)
            .attr("filter", `url(#${filterId})`)
            .style("cursor", "pointer")
            .on("mouseover", (event) => {
              tooltip
                .style("display", "block")
                .style("left", event.pageX + 12 + "px")
                .style("top", event.pageY - 10 + "px")
                .html(
                  `<strong>${m.sourceRegion} → ${m.targetHost}</strong><br/>` +
                    `Latency: <span style="color:${color}">${m.latencyMs.toFixed(1)} ms</span><br/>` +
                    `Status: ${statusEmoji(m.status)} ${m.status}<br/>` +
                    `Packet Loss: ${(m.packetLoss * 100).toFixed(0)}%`
                );
            })
            .on("mouseout", () => {
              tooltip.style("display", "none");
            });

          // Animated pulse on the arc
          svg
            .append("circle")
            .attr("r", 3)
            .attr("fill", color)
            .attr("filter", `url(#${filterId})`)
            .append("animateMotion")
            .attr("dur", `${2 + Math.random() * 2}s`)
            .attr("repeatCount", "indefinite")
            .attr(
              "path",
              `M${sourceProjected[0]},${sourceProjected[1]}A${dr},${dr} 0 0,1 ${targetProjected[0]},${targetProjected[1]}`
            );

          // Source dot
          svg
            .append("circle")
            .attr("cx", sourceProjected[0])
            .attr("cy", sourceProjected[1])
            .attr("r", 5)
            .attr("fill", "#3b82f6")
            .attr("stroke", "#60a5fa")
            .attr("stroke-width", 2)
            .attr("filter", `url(#${filterId})`);

          // Target dot
          svg
            .append("circle")
            .attr("cx", targetProjected[0])
            .attr("cy", targetProjected[1])
            .attr("r", 4)
            .attr("fill", color)
            .attr("stroke", "white")
            .attr("stroke-width", 1.5);
        });
      });
  }, [measurements]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg
        ref={svgRef}
        style={{ width: "100%", height: "100%" }}
        viewBox="0 0 960 500"
        preserveAspectRatio="xMidYMid meet"
      />
      <div
        ref={tooltipRef}
        style={{
          display: "none",
          position: "fixed",
          background: "rgba(10, 14, 26, 0.95)",
          border: "1px solid #2a3a6a",
          borderRadius: "8px",
          padding: "10px 14px",
          fontSize: "13px",
          color: "#e2e8f0",
          pointerEvents: "none",
          zIndex: 100,
          backdropFilter: "blur(8px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
      />
    </div>
  );
}
