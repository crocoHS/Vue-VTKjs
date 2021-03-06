<template>
  <div>
    <h2>MultiSlice Image Mapper</h2>
    <p>
      This demo mirrors the example from
      <a
        href="https://kitware.github.io/vtk-js/examples/MultiSliceImageMapper.html"
      >https://kitware.github.io/vtk-js/examples/MultiSliceImageMapper.html</a>
    </p>
    <select v-model="selectedFile">
      <option v-for="file in files" :key="file">{{ file }}</option>
    </select>
    <hr />
    <div v-if="loading">
      <h3>Loading...</h3>
    </div>
    <div v-else>
      <div>
        <table>
          <tr>
            <td>Slice I</td>
            <td>
              <input
                class="sliceI"
                type="range"
                :min="sliceI.min"
                :max="sliceI.max"
                step="1"
                value="30"
                v-model="sliceI.value"
              />
              <span>{{sliceI.value}}</span>
            </td>
          </tr>
          <tr>
            <td>Slice J</td>
            <td>
              <input
                class="sliceJ"
                type="range"
                :min="sliceJ.min"
                :max="sliceJ.max"
                step="1"
                v-model="sliceJ.value"
              />
              <span>{{sliceJ.value}}</span>
            </td>
          </tr>
          <tr>
            <td>Slice K</td>
            <td>
              <input
                class="sliceK"
                type="range"
                :min="sliceJ.min"
                :max="sliceJ.max"
                step="1"
                v-model="sliceK.value"
              />
              <span>{{sliceK.value}}</span>
            </td>
          </tr>
          <tr>
            <td>Color level</td>
            <td>
              <input
                class="colorLevel"
                type="range"
                :min="level.min"
                :max="level.max"
                step="1"
                v-model="level.value"
              />
            </td>
          </tr>
          <tr>
            <td>ColorWindow</td>
            <td>
              <input
                class="colorWindow"
                type="range"
                :min="window.min"
                :max="window.max"
                step="1"
                v-model="window.value"
              />
            </td>
          </tr>
          <tr>
            <td>Slice Rotate</td>
            <td>
              <input class="rotate" type="range" :min="-90" :max="90" step="1" v-model="rotate" />
              <span>{{rotate}} degrees</span>
            </td>
          </tr>
        </table>
      </div>
      <!-- <div class="row">
        <div class="col">
          <view-2d
            :volumes="volumes"
            :onCreated="this.saveComponentReference(0)"
          />
        </div>
        <div class="col">
          <view-2d
            :volumes="volumes"
            :onCreated="this.saveComponentReference(1)"
          />
        </div>
      </div>-->
      <div class="row">
        <div class="col">
          <view-2d :volumes="volumes" :onCreated="this.saveComponentReference(2)" />
        </div>
        <div class="col">
          <view-generic :onCreated="this.saveComponentReference(3)" :dataDetails="dataDetails" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { View2D, View, vtkInteractorStyleMPRCrosshairs } from "@/library";

import vtkHttpDataSetReader from "vtk.js/Sources/IO/Core/HttpDataSetReader";
import vtkVolume from "vtk.js/Sources/Rendering/Core/Volume";
import vtkVolumeMapper from "vtk.js/Sources/Rendering/Core/VolumeMapper";

import vtkMatrixBuilder from "vtk.js/Sources/Common/Core/MatrixBuilder";

import vtkImageMapper from "vtk.js/Sources/Rendering/Core/ImageMapper";
import vtkImageSlice from "vtk.js/Sources/Rendering/Core/ImageSlice";

import { files } from "@/components/examples";

export default {
  components: {
    "view-2d": View2D,
    "view-generic": View
  },
  data() {
    return {
      volumes: [],
      components: [],
      focusedWidgetId: null,
      window: {
        min: 0,
        max: 0,
        value: 3926
      },
      level: {
        min: 0,
        max: 0,
        value: 1963
      },
      sliceI: {
        min: 0,
        max: 0,
        value: 30
      },
      sliceJ: {
        min: 0,
        max: 0,
        value: 30
      },
      sliceK: {
        min: 0,
        max: 0,
        value: 30
      },
      loading: true,
      selectedFile: files[0],
      rotate: 0
    };
  },
  computed: {
    voi() {
      console.log("voi", Number(this.level.value), Number(this.window.value));
      return {
        windowCenter: Number(this.level.value),
        windowWidth: Number(this.window.value)
      };
    },
    dataDetails() {
      return {
        voi: this.voi
      };
    }
  },
  created() {
    // non-reactive data
    this.files = files;
    this.imageActors = {
      I: null,
      J: null,
      K: null
    };
  },
  watch: {
    selectedFile(newVal) {
      this.loadData(newVal);
    },
    sliceI: {
      handler(newSlice) {
        console.log("setting SliceI", newSlice.value);
        this.imageActors.I.getMapper().setISlice(Number(newSlice.value));
        this.rerenderAllViewports();
      },
      deep: true
    },
    sliceJ: {
      handler(newSlice) {
        this.imageActors.J.getMapper().setKSlice(Number(newSlice.value));
        this.rerenderAllViewports();
      },
      deep: true
    },
    sliceK: {
      handler(newSlice) {
        this.imageActors.K.getMapper().setJSlice(Number(newSlice.value));
        this.rerenderAllViewports();
      },
      deep: true
    },
    window: {
      handler(newWindow) {
        this.updateColorWindow(newWindow.value);
      },
      deep: true
    },
    level: {
      handler(newLevel) {
        this.updateColorLevel(newLevel.value);
      },
      deep: true
    },
    rotate(newRot) {
      let component = this.components[2];

      const renderWindow = component.genericRenderWindow.getRenderWindow();
      const istyle = renderWindow.getInteractor().getInteractorStyle();
      const transform = vtkMatrixBuilder
        .buildFromDegree()
        .rotateZ(Number(newRot));
      let normal = [1, 0, 0];
      transform.apply(normal);
      console.log("newnormal", normal);
      istyle.setSliceNormal(normal, [0, 0, -1]);
      renderWindow.render();
    }
  },
  methods: {
    setWidget(event) {
      const widgetId = event.target.value;

      if (widgetId === "rotate") {
        this.focusedWidgetId = null;
      } else {
        this.focusedWidgetId = widgetId;
      }
    },

    updateColorLevel(level) {
      const colorLevel = Number(level || this.colorLevel);
      Object.values(this.imageActors).forEach(actor =>
        actor.getProperty().setColorLevel(colorLevel)
      );
      this.rerenderAllViewports();
    },

    updateColorWindow(window) {
      const colorWindow = Number(window || this.window);
      Object.values(this.imageActors).forEach(actor =>
        actor.getProperty().setColorWindow(colorWindow)
      );
      this.rerenderAllViewports();
    },

    saveComponentReference(viewportIndex) {
      return component => {
        this.components[viewportIndex] = component;

        const renderWindow = component.genericRenderWindow.getRenderWindow();
        const renderer = component.genericRenderWindow.getRenderer();
        // const camera = renderer.getActiveCamera();

        switch (viewportIndex) {
          default:
          case 0:
            //Axial
            break;
          case 1:
            // sagittal
            break;
          case 2:
            // Coronal
            renderWindow
              .getInteractor()
              .getInteractorStyle()
              .setVolumeMapper(null);
            const istyle = vtkInteractorStyleMPRCrosshairs.newInstance();
            renderWindow.getInteractor().setInteractorStyle(istyle);
            istyle.setVolumeMapper(component.volumes[0]);
            istyle.setSliceNormal([1, 0, 0], [0, 0, -1]);
            break;
          case 3:
            // 3d view
            Object.values(this.imageActors).forEach(actor => {
              console.log("adding actors", actor);
              renderer.addActor(actor);
            });
            renderer.resetCamera();
            renderer.resetCameraClippingRange();

            break;
        }
        renderWindow.render();
      };
    },

    rerenderAllViewports() {
      // Update all render windows, since the automatic re-render might not
      // happen if the viewport is not currently using the painting widget
      Object.values(this.components).forEach(component => {
        component.genericRenderWindow.getRenderWindow().render();
      });
    },
    loadData(fileString) {
      this.loading = true;
      const reader = vtkHttpDataSetReader.newInstance({
        fetchGzip: true
      });
      const volumeActor = vtkVolume.newInstance();
      const volumeMapper = vtkVolumeMapper.newInstance();

      volumeActor.setMapper(volumeMapper);

      this.imageActors.I = vtkImageSlice.newInstance();
      this.imageActors.J = vtkImageSlice.newInstance();
      this.imageActors.K = vtkImageSlice.newInstance();

      reader
        .setUrl(`/${fileString || this.selectedFile}`, { loadData: true })
        .then(() => {
          const data = reader.getOutputData();
          volumeMapper.setInputData(data);

          // FIXME: custom range mapping
          const rgbTransferFunction = volumeActor
            .getProperty()
            .getRGBTransferFunction(0);
          rgbTransferFunction.setMappingRange(500, 3000);

          // update slice min/max values for interface
          // Crate imageMapper for I,J,K planes
          const dataRange = data
            .getPointData()
            .getScalars()
            .getRange();
          const extent = data.getExtent();
          Object.keys(this.imageActors).forEach((plane, idx) => {
            const slice = this[`slice${plane}`];
            slice.min = extent[idx * 2 + 0];
            slice.max = extent[idx * 2 + 1];
            slice.value = Math.floor(slice.min + slice.max / 2);

            const imageMapper = vtkImageMapper.newInstance();
            imageMapper.setInputData(data);
            imageMapper[`set${plane}Slice`](slice.value);
            this.imageActors[plane].setMapper(imageMapper);

            console.log(`slice${plane}`, `set${plane}Slice`, imageMapper);
          });
          this.window = {
            min: 0,
            max: dataRange[1] * 2,
            value: dataRange[1]
          };
          this.level = {
            min: -dataRange[1],
            max: dataRange[1],
            value: (dataRange[0] + dataRange[1]) / 2
          };
          this.updateColorLevel();
          this.updateColorWindow();

          this.volumes = [volumeActor];
          this.loading = false;
        });
    }
  },
  mounted() {
    this.loadData();
  }
};
</script>

<style scoped>
.col {
  max-height: 400px;
}
</style>
