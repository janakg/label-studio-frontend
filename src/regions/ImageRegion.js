import { getParent, getRoot, types } from "mobx-state-tree";
import { cloneNode } from "../core/Helpers";
import { guidGenerator } from "../core/Helpers";
import { AnnotationMixin } from "../mixins/AnnotationMixin";

// @todo remove file
const RegionMixin = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),

    score: types.maybeNull(types.number),

    readonly: types.optional(types.boolean, false),

    hidden: types.optional(types.boolean, false),

    selected: types.optional(types.boolean, false),
    highlighted: types.optional(types.boolean, false),

    parentID: types.optional(types.string, ""),
  })
  .views(self => ({
    get perRegionStates() {
      const states = self.states;

      return states && states.filter(s => s.perregion === true);
    },

    get store() {
      return getRoot(self);
    },

    get parent() {
      return getParent(self);
    },

    get editable() {
      return self.readonly === false && self.annotation.editable === true;
    },

    get labelsState() {
      return self.states.find(s => s.type.indexOf("labels") !== -1);
    },

    hasLabelState(labelValue) {
      // first of all check if this region implements labels
      // interface
      const s = self.labelsState;

      if (!s) return false;

      // find that label and check if its selected
      const l = s.findLabel(labelValue);

      if (!l || !l.selected) return false;

      return true;
    },
  }))
  .actions(self => ({
    setParentID(id) {
      self.parentID = id;
    },
    
    setScore(score) {
      self.score = score;
    },

    // All of the below accept size as an arument
    moveTop() {},
    moveBottom() {},
    moveLeft() {},
    moveRight() {},

    sizeRight() {},
    sizeLeft() {},
    sizeTop() {},
    sizeBottom() {},

    // "web" degree is opposite to mathematical, -90 is 90 actually
    // swapSizes = true when canvas is already rotated at this moment
    rotatePoint(point, degree, swapSizes = true) {
      const { x, y } = point;

      if (!degree) return { x, y };

      degree = (360 + degree) % 360;
      // transform origin is (w/2, w/2) for ccw rotation
      // (h/2, h/2) for cw rotation
      const w = self.parent.stageWidth;
      const h = self.parent.stageHeight;
      // actions: translate to fit origin, rotate, translate back
      //   const shift = size / 2;
      //   const newX = (x - shift) * cos + (y - shift) * sin + shift;
      //   const newY = -(x - shift) * sin + (y - shift) * cos + shift;
      // for ortogonal degrees it's simple:

      if (degree === 270) return { x: y, y: (swapSizes ? h : w) - x };
      if (degree === 90) return { x: (swapSizes ? w : h) - y, y: x };
      if (Math.abs(degree) === 180) return { x: w - x, y: h - y };
      return { x, y };
    },

    rotateDimensions({ width, height }, degree) {
      if ((degree + 360) % 180 === 0) return { width, height };
      return { width: height, height: width };
    },

    // update region appearence based on it's current states, for
    // example bbox needs to update its colors when you change the
    // label, becuase it takes color from the label
    updateAppearenceFromState() {},

    serialize() {
      console.error("Region class needs to implement serialize");
    },

    toStateJSON() {
      const parent = self.parent;
      const buildTree = control => {
        const tree = {
          id: self.pid,
          from_name: control.name,
          to_name: parent.name,
          source: parent.value,
          type: control.type,
          parent_id: self.parentID === "" ? null : self.parentID,
          score: parent.score? parent.score :  null,
        };

        if (self.normalization) tree["normalization"] = self.normalization;

        return tree;
      };

      if (self.states && self.states.length) {
        return self.states
          .map(s => {
            const ser = self.serialize(s, parent);

            if (!ser) return null;

            const tree = {
              ...buildTree(s),
              ...ser,
            };

            // in case of labels it's gonna be, labels: ["label1", "label2"]

            return tree;
          })
          .filter(Boolean);
      } else {
        const obj = self.annotation.toNames.get(parent.name);
        const control = obj.length ? obj[0] : obj;

        const tree = {
          ...buildTree(control),
          ...self.serialize(control, parent),
        };

        return tree;
      }
    },

    updateOrAddState(state) {
      const foundIndex = self.states.findIndex(s => s.name === state.name);

      if (foundIndex !== -1) {
        self.states[foundIndex] = cloneNode(state);
        self.updateAppearenceFromState();
      } else {
        self.states.push(cloneNode(state));
      }
    },

    // given the specific state object (for example labels) it finds
    // that inside the region states objects and updates that, this
    // function is used to capture the state
    updateSingleState(state) {
      const foundIndex = self.states.findIndex(s => s.name === state.name);

      if (foundIndex !== -1) {
        self.states[foundIndex] = cloneNode(state);

        // user is updating the label of the region, there might
        // be other states that depend on the value of the region,
        // therefore we need to recheck here
        if (state.type.indexOf("labels") !== -1) {
          const states = self.states.filter(s => s.whenlabelvalue !== null && s.whenlabelvalue !== undefined);

          states && states.forEach(s => self.states.remove(s));
        }

        self.updateAppearenceFromState();
      }
    },

    selectRegion() {
      self.selected = true;
      self.annotation.setHighlightedNode(self);

      self.annotation.loadRegionState(self);
    },

    /**
     * Common logic for unselection; specific actions should be in `afterUnselectRegion`
     * @param {boolean} tryToKeepStates try to keep states selected if such settings enabled
     */
    unselectRegion(tryToKeepStates = false) {
      const annotation = self.annotation;
      const parent = self.parent;
      const keepStates = tryToKeepStates && self.store.settings.continuousLabeling;

      if (annotation.relationMode) {
        annotation.stopRelationMode();
      }
      if (parent.setSelected) {
        parent.setSelected(undefined);
      }

      self.selected = false;
      annotation.setHighlightedNode(null);

      self.afterUnselectRegion();

      if (!keepStates) {
        annotation.unloadRegionState(self);
      }
    },

    afterUnselectRegion() {},

    onClickRegion() {
      const annotation = self.annotation;

      if (!annotation.editable) return;

      if (annotation.relationMode) {
        annotation.addRelation(self);
        annotation.stopRelationMode();
        annotation.regionStore.unselectAll();
      } else {
        if (self.selected) {
          self.unselectRegion(true);
        } else {
          annotation.regionStore.unselectAll();
          self.selectRegion();
        }
      }
    },

    /**
     * Remove region
     */
    deleteRegion() {
      if (!self.annotation.editable) return;

      self.unselectRegion();

      self.annotation.relationStore.deleteNodeRelation(self);

      if (self.type === "polygonregion") {
        self.destroyRegion();
      }

      self.annotation.regionStore.deleteRegion(self);

      self.annotation.deleteRegion(self);
    },

    setHighlight(val) {
      self._highlighted = val;
    },

    toggleHighlight() {
      self.setHighlight(!self.highlighted);
    },

    toggleHidden() {
      self.hidden = !self.hidden;
    },
  }));

export default types.compose(RegionMixin, AnnotationMixin);
