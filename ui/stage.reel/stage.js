/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/**
    @module "montage/ui/stage.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;
var Utilities = require("runtime/utilities").Utilities;
var Node = require("runtime/node").Node;
var Camera = require("runtime/camera").Camera;
var GLSLProgram = require("runtime/glsl-program").GLSLProgram;
var glMatrix = require("runtime/dependencies/gl-matrix").glMatrix;

/**
    Description TODO
    @class module:"montage/ui/stage.reel".Stage
    @extends module:montage/ui/component.Component
*/
exports.Stage = Montage.create(Component, /** @lends module:"montage/ui/stage.reel".Stage# */ {

    view: {
        get: function() {
            return this.templateObjects ? this.templateObjects.view : null;
        }
    },

    progress: {
        get: function() {
            var options = this.templateObjects.options;
            return options ? options.progress : null;
        }
    },

    selectModel: {
        get: function() {
            var options = this.templateObjects.options;
            return options ? options.selectModel : null;
        }
    },

    selectCamera: {
        get: function() {
            var options = this.templateObjects.options;
            return options ? options.selectCamera : null;
        }
    },

    restart: {
        value: function() {
            var self = this;
            var view = this.view;
            if (view) {
                if (view.sceneRenderer) {
                    if (view.sceneRenderer.scene) {
                        view.sceneRenderer.technique.rootPass.scene.rootNode.apply( function(node, parent) {
                            if (node.meshes) {
                                if (node.meshes.length) {
                                    node.meshes.forEach( function(mesh) {
                                        mesh.loadedPrimitivesCount = 0;
                                        mesh.step = 0;
                                    }, self);
                                }
                            }
                            return null;
                        } , true, null);
                    }
                }
                var progress = this.progress;
                if (progress) {
                    progress.value = 0;
                    progress.element.style.opacity = 1;
                }
            }
        }
    },

    /**
     @param
         @returns
     */
    templateDidLoad:{
        value:function () {
            var listenerObj = {};
            var self = this;
            listenerObj.handleRestartAction = function(event) {
                self.restart.call(self);
            }

            this.templateObjects.options.addEventListener("action", listenerObj, false);
            this.view.delegate = this;
        }
    },

    viewPoint: {
        get: function() {
            return this.view.viewPoint;
        },
        set: function(value) {
            if (value !== this._model) {
                this.view.viewPoint = value;
            }
        }
    },

    _model: {value: null, writable:true},

    model: {
        get: function() {
            return this._model;
        },
        set: function(value) {
            if (value !== this._model) {
                this._model = value;
                this.run(this.model);
            }
        }
    },

    location: {value: null, writable: true},

    _fillViewport: {
        value: true
    },

    fillViewport: {
        get: function() {
            return this._fillViewport;
        },
        set: function(value) {
            if (value === this._fillViewport) {
                return;
            }

            this._fillViewport = value;

            if (this._isComponentExpanded) {
                if (this._fillViewport) {
                    window.addEventListener("resize", this, true);
                } else {
                    window.removeEventListener("resize", this, true);
                }
            }
        }
    },

    height: {value: null, writable:true},
    width: {value: null, writable:true},

    enterDocument: {
        value: function(firstTime) {
            if (this.selectModel) {
                ///this.selectModel.content.push( { "name": "layout", "path":"model/remi/layout/LayOut.json"} );

                this.selectModel.content.push( { "name": "duck", "path":"model/duck/duck.json"} );
                this.selectModel.content.push( { "name": "Buggy", "path":"model/rambler/Rambler.json"} );
                this.selectModel.content.push( { "name": "SuperMurdoch", "path":"model/SuperMurdoch/SuperMurdoch.json"} );
                this.selectModel.content.push( { "name": "Wine", "path":"model/wine/wine.json"} );

                this.selectModel.needsDraw = true;
                this.model = this.selectModel.content[0].path;
            }

            if (this.fillViewport) {
                window.addEventListener("resize", this, true);
            }
        }
    },

    captureResize: {
        value: function(evt) {
            this.needsDraw = true;
        }
    },

    willDraw: {
        value: function() {
            this.view.width = this.width = window.innerWidth - 270;
            this.view.height = this.height = window.innerHeight;
        }
    },

    _bytesLimit: { value: 0, writable: true },

    bytesLimit: {
        set: function(value) {
            if (this._bytesLimit !== value) {
                this._bytesLimit = value ;
            }
        }, 
        get: function(value) {
            return this._bytesLimit;
        }
    },

    _concurrentRequests: { value: 6, writable: true },

    concurrentRequests: {
        set: function(value) {
            if (value) {
                this._concurrentRequests = Math.floor(parseInt(value));
            }
        },
        get: function(value) {
            return this._concurrentRequests;
        }
    },

    run: {
        value: function(scenePath) {
            this.restart();
            if (this.view) {
                this.view.scenePath = scenePath;
                this.view.needsDraw = true;
            }
        }
    },

    sceneWillChange: {
        value: function() {
            var resourceManager = this.view.getResourceManager();
            if (resourceManager) {
                resourceManager.maxConcurrentRequests = this.concurrentRequests;
                resourceManager.bytesLimit = this.bytesLimit * 1000;
                resourceManager.reset();
            }
        }
    },

    sceneDidChange: {
        value: function() {
            var progress = this.progress;
            if (progress) {
                progress.element.style["-webkit-transition-duration"] = "1s";
                progress.element.style.opacity = 1;
                progress.max = this.view.totalBufferSize;
                progress.value = 0;

                this.restart();
                var resourceManager = this.view.getResourceManager();
                if (resourceManager) {
                    if (resourceManager.observers.length === 1) { //FIXME:...
                        resourceManager.observers.push(this);
                    }
                }
                this.selectCamera.content = [];

                var cameraNodes = [];
                this.view.scene.rootNode.apply( function(node, parent, context) {
                    if (node.cameras) {
                        if (node.cameras.length)
                            cameraNodes = cameraNodes.concat(node);
                    }
                    return context;
                } , true, null);

                cameraNodes.forEach( function(cameraNode) {
                    this.selectCamera.content.push( { "name": cameraNode.name, "node":cameraNode} );
                }, this);
                this.selectCamera.needsDraw = true;

            }
        }
    },

    resourceAvailable: {
        value: function(resource) {
            var progress = this.progress;
            if (progress) {
                if (resource.range) {
                    progress.value += resource.range[1] - resource.range[0];
                    if (progress.value >= progress.max) {
                        progress.element.style.opacity = 0;
                        setTimeout(function() { 
                            progress.value = 0;
                        },1000);

                    }
                }
            }
        }
    },


});
