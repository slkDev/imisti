import * as THREE from 'three';
import fragment from '../shaders/fragment.glsl';
import fragmentSimulation from '../shaders/fragmentSimulation.glsl';
import vertex from '../shaders/vertexParticle.glsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


import * as dat from "dat.gui";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import logo from '../glb/logo.glb';
import gsap from 'gsap';

import ScrollTrigger from 'gsap/ScrollTrigger';
import { snap } from "gsap/all";
gsap.registerPlugin(ScrollTrigger);

import SmoothScroll from 'smooth-scroll';
const scroll = new SmoothScroll('.page', {
	speed: 3000,
	speedAsDuration: true
});
const change = document.querySelector('.change');
const cursor = document.querySelector('.cursor');
let pageTwo = document.querySelector('.pageTwo').offsetTop;
    document.addEventListener('mousemove', (e)=>{
      cursor.setAttribute("style", "transform: translate("+e.pageX+"px,"+e.pageY+"px);");
      if(e.pageY>=pageTwo){
        change.style.display = "none";
        cursor.classList.remove("explore");
      }
    })
gsap.from('#container',{
    opacity: 0,
    duration: 5,
    ease: 'easeIn'
})
gsap.fromTo(cursor, {
    scale: 0,
    opacity: 0,
},{
    opacity: 1,
    scale: 1,
    duration: 0.6,
    ease: "elastic.out(1, 0.3)",
})
const WIDTH = 1;

export default class Sketch{
    constructor(options) {
        this.scene = new THREE.Scene();
        this.scene.background = null;
        this.container = options.dom;

        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.renderer = new THREE.WebGLRenderer({alpha: true});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.setClearColor(0x020305, 0);
        this.renderer.physicallyCorrectLights = true;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        this.container.appendChild( this.renderer.domElement );
        this.camera = new THREE.PerspectiveCamera( 6, window.innerWidth / window.innerHeight, 1, 1000 );
        this.loader = new GLTFLoader();

	    this.camera.position.set(0, 0, 3);

        // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.time = 0;
        this.time2 = 0;

        this.mouse = 0;

        this.isPlaying = true;

        this.loader.load(logo, (gltf) =>{
            this.model = gltf.scene.children[0];
            
            this.logoPos = this.model.geometry.attributes.position.array;
            this.logoNumber = this.logoPos.length/3;

            this.addObjects();
            this.animacja();
            this.resize();
            this.render();
            this.setupResize();
        })

        // this.settings();
    }

    animacja(){
        let tl = gsap.timeline({onComplete:     function(){
            change.style.display = "block";
            cursor.classList.add("explore");
          }});
        // tl.fromTo(this.camera.rotation,{
        //     y: Math.PI *100
        // },{
        //     y:  0,
        //     duration:1
        // })
        tl.fromTo(this.camera.position,{
            z: 0,
        },{
            z: 3,
            duration:5,
            ease: 'SlowMo.ease.config( 0.7 0.7, 0.7 0.7, false)'
        })
        tl.fromTo(this.camera.rotation,{
            y: Math.PI *100
        },{
            y:  0,
            duration:1.5
        },"-=4")
        .to(this.scene.rotation, {
            x: 4,
            y: 1.55,
            z: 1,
            ease: 'SlowMo.ease.config( 0.7 0.7, 0.7 0.7, false)',
            duration: 0.5
        },"-=2")
        tl.fromTo(this.camera.rotation,{
            y: Math.PI *23
        },{
            y:  0,
            duration:0.6
        },"-=2");
        // tl.fromTo(this.camera.position,{
        //     x: 0,
        // },{
        //     x: 0.3,
        //     duration:0.3,
        //     ease: 'SlowMo.ease.config( 0.7 0.7, 0.7 0.7, false)'
        // },"-=2");
        tl.to('.literaIntro',{
            opacity: 1, y: '0', scale: 1,rotate: 0,clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', stagger: '.1'
        },"-=1");
        tl.fromTo('.ramka',{
            width: 0,
            opacity: 0,
        },{
            width: '130px',
            opacity: 1,
            duration: 0.6,
            ease: 'SlowMo.ease.config( 0.7 0.7, 0.7 0.7, false)',
        },"-=1");
    }

    fillPositions(texture){
        let arr =  texture.image.data;
        for (let i = 0; i < arr.length; i=i+4) {

                let rand = Math.floor(Math.random()*this.logoNumber)
                // let x = Math.random();
                // let y = Math.random();
                // let z = Math.random();
            
                let x = this.logoPos[3*rand];
                let y = this.logoPos[3*rand+1];
                let z = this.logoPos[3*rand+2];

                arr[i] = x;
                arr[i+1] = y;
                arr[i+2] = z;
                arr[i+3] = 1;
        }
    }

    settings(){
        let that = this;
        this.settings = {
            rotation: 0,
        };
        this.gui = new dat.GUI();
        this.gui.add(this.settings, "progress", 0,1,0.01);
    }

    setupResize(){
        window.addEventListener("resize", this.resize.bind(this));
    }

    resize(){
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width / this.height;

        this.material.uniforms.resolution.value.x = this.width;
        this.material.uniforms.resolution.value.y = this.height;

        this.camera.updateProjectionMatrix();
    }

    addObjects(){
        let that = this;

        this.material = new THREE.ShaderMaterial({
           extensions: {
                derivatives: "#extension GL_OES_standard_derivatives : enable"
           },
           side: THREE.DoubleSide,
           uniforms:{
                time: { type: "f", value: 0},
                time2: { type: "f", value: 0},
                positionTexture: {value: null},
                resolution: { type: "v4", value: new THREE.Vector4() },
                uvRate1:{
                    value: new THREE.Vector2(1, 1)
                }
            },
            // wireframe: true,
            // transparent: true,
           fragmentShader: fragment,
           vertexShader: vertex,
        });

        this.geometry = new THREE.BufferGeometry();
        let positions = new Float32Array(WIDTH*WIDTH*3);
        let reference = new Float32Array(WIDTH*WIDTH*2);

        for (let i = 0; i < WIDTH*WIDTH; i++) {
            let x = Math.random();
            let y = Math.random();
            let z = Math.random();
            let xx = (i%WIDTH)/WIDTH;
            let yy = ~~(i/WIDTH)/WIDTH;
            positions.set([x,y,z],i*3);
            reference.set([xx,yy],i*2);
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions,3))
        this.geometry.setAttribute('reference', new THREE.BufferAttribute(reference,2))

        this.geometry = this.model.geometry;
        this.plane = new THREE.Points( this.geometry, this.material );
	    this.scene.add(this.plane);
    }
    stop(){
        this.isPlaying = false;
    }
    play(){
        if(!this.isPlaying){
            this.render()
            this.isPlaying = true;
        }
    }
    render(){
        if(!this.isPlaying) return;
        this.time += 0.05;
        this.time2 += 0.0005;
        // this.scene.rotation.x = 4; 
        // this.scene.rotation.y = 1.55; //1.55
        // this.scene.rotation.z = 1; 
        this.material.uniforms.time.value = this.time;
        requestAnimationFrame(this.render.bind(this));
        this.renderer.render( this.scene, this.camera );
    }
}

let sketch = new Sketch({
    dom: document.getElementById("container")
});

let literowanieX1 = document.querySelector('.pageTwo h1');
literowanieX1.innerHTML = literowanieX1.textContent.replace(/\S/g, "<span class='literaPT'>$&</span>");
let literowanieX2 = document.querySelector('.pageThree h1');
literowanieX2.innerHTML = literowanieX2.textContent.replace(/\S/g, "<span class='literaPTE'>$&</span>");

  const tl4 = gsap.timeline({
    scrollTrigger: {
      trigger: ".pageTwo",
      start: "top center",
      end: "bottom bottom",
      scrub: true,
      markers: false,
    }
  });
  const tl8 = gsap.timeline({
    scrollTrigger: {
      trigger: ".pageThree",
      start: "top center",
      end: "bottom bottom",
      scrub: true,
      markers: false,
    }
  });
  const tl5 = gsap.timeline({
    scrollTrigger: {
      trigger: ".pageTwo",
      start: "top bottom",
      end: "bottom bottom",
      scrub: true,
      markers: false,
    }
  });
  const tl6 = gsap.timeline({
    scrollTrigger: {
      trigger: ".pageThree",
      start: "top bottom",
      end: "bottom bottom",
      scrub: true,
      markers: false,
    }
  });
  const tl7 = gsap.timeline({
    scrollTrigger: {
      trigger: ".kontakt",
      start: "top bottom",
      end: "bottom bottom",
      markers: false,
      scrub: true,
    }
  });

    tl5.fromTo(sketch.scene.rotation,{
        y: 1.55,
    },{
        y: 0.1,
    })
    tl5.to(sketch.scene.position,{
        z: 2,
    })
    tl4.fromTo('.literaPT',{
       opacity: 0, scale: 0, rotate: '270deg', clipPath: 'clip-path: polygon(0 0, 100% 0, 100% 0, 0 0)', stagger: '.1',
    },{
        opacity: 1, y: '0', scale: 1,rotate: 0,clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', stagger: '.1'
    })
    tl8.fromTo('.literaPTE',{
        opacity: 0, scale: 0, rotate: '270deg', clipPath: 'clip-path: polygon(0 0, 100% 0, 100% 0, 0 0)', stagger: '.1',
     },{
         opacity: 1, y: '0', scale: 1,rotate: 0,clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', stagger: '.1'
     })
    tl6.to(sketch.scene.rotation,{
        y: 1.55,
    })
    tl6.to(sketch.camera.position,{
        z: 3,
    })
    tl7.fromTo(sketch.scene.rotation,{
        y: 1.55,
    },{
        y: 0.1,
    })
    tl7.to(sketch.scene.position,{
        z: 2,
    })