import BasicVolume from "./BasicVolume.vue";
import MPRCrosshairs from "./MPRCrosshairs.vue";
import PaintWidget from "./PaintWidget.vue";

export default [
  {
    title: "Basic Usage",
    url: "basic",
    description:
      "How to use the component to render an array of vtkVolumes and manipulate their RGB Transfer Functions",
    component: BasicVolume
  },
  {
    title: "Image Segmentation via Paint Widget",
    url: "paintwidget",
    description:
      "This example demonstrates how to use VTK's PaintWidget and PaintFilter to perform manual segmentation.",
    component: PaintWidget
  },
  {
    title: "MPR Crosshairs",
    url: "crosshairs",
    description:
      "Demonstrates how to set up the Crosshairs interactor style and SVG Widget",
    component: MPRCrosshairs
  }
];