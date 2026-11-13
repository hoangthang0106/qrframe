import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  BODY_STYLES, EYE_STYLES, normalizeStyle,
  isFinderCell, finderOrigins, modulePrimitive, finderPrimitives,
  paintSvgPrimitive, paintCanvasPrimitive,
  outputWidth, outputDimensions
} from "../secure/qr-style.js";

test("9 QR module styles and 3 safe finder eye styles are available", () => {
  assert.equal(BODY_STYLES.length, 9);
  assert.deepEqual(EYE_STYLES, ["square", "rounded", "dot"]);
  const selector = readFileSync(new URL("../secure/index.html", import.meta.url), "utf8");
  for (const shape of BODY_STYLES) assert.match(selector, new RegExp('<option value="' + shape + '"'));
  for (const eye of EYE_STYLES) assert.ok(selector.includes('<option value="' + eye + '"'));
  assert.equal(normalizeStyle("not-a-shape", BODY_STYLES, "square"), "square");
});

test("finder detection preserves three 7x7 corner eyes", () => {
  for (const side of [21,25,33,57,177]) {
    assert.deepEqual(finderOrigins(side), [[0,0],[side-7,0],[0,side-7]]);
    assert.equal(isFinderCell(0,0,side),true);
    assert.equal(isFinderCell(6,6,side),true);
    assert.equal(isFinderCell(side-1,6,side),true);
    assert.equal(isFinderCell(6,side-1,side),true);
    assert.equal(isFinderCell(7,7,side),false);
    assert.equal(isFinderCell(side-8,6,side),false);
    assert.equal(isFinderCell(6,side-8,side),false);
  }
});

test("module primitives remain within their module for every body shape", () => {
  for (const shape of BODY_STYLES) {
    const p = modulePrimitive(shape, 10, 12, false);
    assert.ok(["rect","circle","polygon"].includes(p.kind), shape);
    if (p.kind === "rect") {
      assert.ok(p.x >= 10 && p.y >= 12 && p.x + p.w <= 11 && p.y + p.h <= 13, shape);
    }
    if (p.kind === "circle") {
      assert.ok(p.cx-p.r >= 10 && p.cx+p.r <= 11 &&
        p.cy-p.r >= 12 && p.cy+p.r <= 13,shape);
    }
    if (p.kind === "polygon") {
      for (const [x,y] of p.points) {
        assert.ok(x >= 10 && x <= 11 && y >= 12 && y <= 13,shape);
      }
    }
    const protectedCell = modulePrimitive(shape, 10, 12, true);
    assert.deepEqual(protectedCell,{kind:"rect",x:10,y:12,w:1,h:1,r:0},shape);
  }
});

test("finder eyes are complete 7x7, dark outer and center with light ring", () => {
  assert.deepEqual(finderPrimitives(4,5,"square"),[]);
  for(const style of ["rounded","dot"]){
    const eyes=finderPrimitives(4,5,style);
    assert.equal(eyes.length,3);
    assert.deepEqual(eyes.map(x=>x.role),["foreground","background","foreground"]);
    assert.equal(eyes[0].x,4);
    assert.equal(eyes[0].y,5);
    assert.equal(eyes[0].w,7);
    assert.equal(eyes[0].h,7);
    assert.equal(eyes[1].w,5);
    assert.equal(eyes[1].h,5);
  }
});

test("SVG and PNG paint functions cover all primitive types", () => {
  const make=(name,attrs)=>({name,attrs});
  const fake={
    fillStyle:"",
    beginPath(){},arc(){},fill(){},moveTo(){},lineTo(){},closePath(){},
    fillRect(){},roundRect(){}
  };
  for(const shape of BODY_STYLES){
    const primitive=modulePrimitive(shape,2,3);
    const svg=paintSvgPrimitive(primitive,"#000","#fff",make);
    assert.ok(["rect","circle","polygon"].includes(svg.name));
    assert.doesNotThrow(()=>paintCanvasPrimitive(fake,primitive,"#000","#fff",8));
  }
  for(const p of finderPrimitives(0,0,"rounded")){
    assert.doesNotThrow(()=>paintCanvasPrimitive(fake,p,"#000","#fff",8));
  }
});

test("PNG/SVG width selection and custom pixel size validation", () => {
  for (const w of [256,512,1024,2048,3072,4096]) {
    assert.equal(outputWidth(String(w)),w);
  }
  assert.equal(outputWidth("custom","1365"),1365);
  for(const bad of ["","abc","0","255","4097","8000000","512.5","0x400","-512"]){
    assert.throws(()=>outputWidth("custom",bad),bad);
  }
  assert.deepEqual(outputDimensions(1024,41,41),{width:1024,height:1024});
  assert.deepEqual(outputDimensions(512,41,82),{width:512,height:1024});
  assert.throws(()=>outputDimensions(4096,25,80));
  assert.throws(()=>outputDimensions(1024,0,41));
});

test("style, eye and export controls are wired to preview AND exported PNG/SVG", () => {
  const html=readFileSync(new URL("../secure/index.html", import.meta.url),"utf8");
  const app=readFileSync(new URL("../secure/app.js", import.meta.url),"utf8");
  assert.match(html,/id="eye-style"/);
  assert.match(html,/id="output-size"/);
  assert.match(html,/id="output-custom" type="number"/);
  assert.match(html,/id="output-dimensions"/);
  assert.match(app,/paintSvgPrimitive\(primitive/);
  assert.match(app,/paintCanvasPrimitive\(ctx/);
  assert.match(app,/copy\.setAttribute\("width", String\(current\.exportDims\.width\)\)/);
  assert.match(app,/copy\.setAttribute\("height", String\(current\.exportDims\.height\)\)/);
  assert.match(app,/canvas\.width = exportDims\.width/);
  assert.match(app,/canvas\.height = exportDims\.height/);
  assert.doesNotMatch(app,/PNG_SIZE/);
  assert.doesNotMatch(app,/innerHTML\s*=/);
  assert.doesNotMatch(app,/fetch\s*\(/);
});
