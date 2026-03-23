import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const ANIMATION_LABELS = {
  chop: '🔪 Chopping', slice: '🔪 Slicing', dice: '🔪 Dicing',
  stir: '🥄 Stirring', cook: '🥄 Cooking',
  boil: '💧 Boiling', simmer: '💧 Simmering',
  fry: '🍳 Frying', saute: '🍳 Sautéing',
  mix: '🥣 Mixing', whisk: '🥣 Whisking', blend: '🥣 Blending',
  bake: '🔥 Baking', roast: '🔥 Roasting',
  pour: '🫗 Pouring', add: '🫗 Adding',
  plate: '🍽️ Plating', serve: '🍽️ Serving',
  season: '🧂 Seasoning', salt: '🧂 Seasoning',
  heat: '🔥 Heating', wash: '🚿 Washing', cool: '❄️ Cooling',
  idle: '👨‍🍳 Ready'
}

export default function Kitchen3D({ animationType = 'idle', ingredients = [] }) {
  const mountRef = useRef(null)
  const stateRef = useRef({
    animationType: 'idle',
    setupFn: null,
    time: 0
  })

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    // ── Renderer ──────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    el.appendChild(renderer.domElement)

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }

    // ── Scene ──────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0d1117)
    scene.fog = new THREE.FogExp2(0x0d1117, 0.09)

    // ── Camera ─────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60)
    camera.position.set(0, 3.5, 7)
    camera.lookAt(0, 0.5, 0)

    // ── Lights ─────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xfff5e0, 0.5))

    const sun = new THREE.DirectionalLight(0xfff8e8, 1.4)
    sun.position.set(4, 10, 6)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.near = 0.5
    sun.shadow.camera.far = 30
    sun.shadow.camera.left = -5
    sun.shadow.camera.right = 5
    sun.shadow.camera.top = 5
    sun.shadow.camera.bottom = -5
    sun.shadow.bias = -0.0005
    scene.add(sun)

    const fillLight = new THREE.PointLight(0xff8844, 0.6, 12)
    fillLight.position.set(-3, 2, 3)
    scene.add(fillLight)

    const topLight = new THREE.SpotLight(0xffffff, 0.8, 15, Math.PI / 5, 0.4)
    topLight.position.set(0, 8, 0)
    topLight.target.position.set(0, 0, 0)
    scene.add(topLight)
    scene.add(topLight.target)

    // ── Materials ──────────────────────────────────────────────────
    const M = {
      counter: new THREE.MeshStandardMaterial({ color: 0xE8E0D5, roughness: 0.25, metalness: 0.05 }),
      wall: new THREE.MeshStandardMaterial({ color: 0xF5F0EA, roughness: 0.9 }),
      cabinet: new THREE.MeshStandardMaterial({ color: 0x7B5E3A, roughness: 0.8 }),
      floor: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 }),
      metal: new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.85, roughness: 0.15 }),
      darkMetal: new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 }),
      wood: new THREE.MeshStandardMaterial({ color: 0xC4A265, roughness: 0.9 }),
      white: new THREE.MeshStandardMaterial({ color: 0xFFFFF8, roughness: 0.2 }),
      burnerOff: new THREE.MeshStandardMaterial({ color: 0x444444 }),
    }

    // ── Static Kitchen Environment ─────────────────────────────────
    const env = new THREE.Group()

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), M.floor)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.52
    floor.receiveShadow = true
    env.add(floor)

    // Counter top
    const counter = new THREE.Mesh(new THREE.BoxGeometry(6, 0.14, 2.2), M.counter)
    counter.position.set(0, 0, 0)
    counter.receiveShadow = true
    counter.castShadow = true
    env.add(counter)

    // Counter body
    const counterBody = new THREE.Mesh(new THREE.BoxGeometry(6, 1.0, 2.2), new THREE.MeshStandardMaterial({ color: 0x5C4023, roughness: 0.85 }))
    counterBody.position.set(0, -0.57, 0)
    counterBody.castShadow = true
    env.add(counterBody)

    // Back wall
    const wall = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 0.1), M.wall)
    wall.position.set(0, 1.8, -1.15)
    wall.receiveShadow = true
    env.add(wall)

    // Side walls (hint)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4, 3), M.wall)
    leftWall.position.set(-3.05, 1.8, 0)
    env.add(leftWall)
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4, 3), M.wall)
    rightWall.position.set(3.05, 1.8, 0)
    env.add(rightWall)

    // Cabinets above
    const cab = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.9, 0.55), M.cabinet)
    cab.position.set(0, 3.1, -0.88)
    cab.castShadow = true
    env.add(cab)

    // Cabinet handles
    const handleGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.35, 8)
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xC8C8C8, metalness: 0.9, roughness: 0.1 })
    ;[-2, -0.7, 0.7, 2].forEach(x => {
      const h = new THREE.Mesh(handleGeo, handleMat)
      h.rotation.z = Math.PI / 2
      h.position.set(x, 2.7, -0.62)
      env.add(h)
    })

    // Under-cabinet LED strip glow
    const ledGeo = new THREE.BoxGeometry(5.8, 0.04, 0.04)
    const ledMat = new THREE.MeshStandardMaterial({ color: 0xFFEEAA, emissive: 0xFFEEAA, emissiveIntensity: 1 })
    const led = new THREE.Mesh(ledGeo, ledMat)
    led.position.set(0, 2.65, -0.63)
    env.add(led)

    // Backsplash tiles (subtle grid pattern via two boxes)
    const backsplash = new THREE.Mesh(new THREE.BoxGeometry(6, 1.8, 0.06), new THREE.MeshStandardMaterial({ color: 0xDDD8D0, roughness: 0.5 }))
    backsplash.position.set(0, 1.0, -1.12)
    env.add(backsplash)

    // Stove/cooktop built into counter (right side)
    const stoveTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.02, 1.4), new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6 }))
    stoveTop.position.set(1.5, 0.07, 0)
    env.add(stoveTop)

    // Burner rings (static off-state)
    ;[[-0.4, 0.3], [0.4, 0.3], [-0.4, -0.3], [0.4, -0.3]].forEach(([bx, bz]) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 24), M.burnerOff)
      ring.rotation.x = Math.PI / 2
      ring.position.set(1.5 + bx, 0.09, bz)
      env.add(ring)
    })

    // Spice rack on wall
    const rackGeo = new THREE.BoxGeometry(1.2, 0.25, 0.2)
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x5C4023 })
    const rack = new THREE.Mesh(rackGeo, rackMat)
    rack.position.set(-1.8, 2.1, -1.08)
    env.add(rack)
    ;[-0.4, 0, 0.4].forEach((sx, i) => {
      const spiceGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.18, 10)
      const colors = [0xDD4444, 0xDDAA22, 0x44AA44]
      const spice = new THREE.Mesh(spiceGeo, new THREE.MeshStandardMaterial({ color: colors[i], transparent: true, opacity: 0.85 }))
      spice.position.set(-1.8 + sx, 2.27, -1.05)
      env.add(spice)
    })

    scene.add(env)

    // ── Dynamic Cooking Objects ────────────────────────────────────
    const dynGroup = new THREE.Group()
    scene.add(dynGroup)

    const particles = []

    function clearDyn() {
      while (dynGroup.children.length) dynGroup.remove(dynGroup.children[0])
      particles.length = 0
    }

    // Helper builders
    function mkPot() {
      const g = new THREE.Group()
      const mat = M.metal.clone()
      g.add(obj(new THREE.CylinderGeometry(0.52, 0.46, 0.75, 32), mat))
      const rim = obj(new THREE.TorusGeometry(0.52, 0.03, 8, 32), mat)
      rim.position.y = 0.375; g.add(rim)
      // Handles
      ;[0, Math.PI].forEach(a => {
        const hg = new THREE.Group()
        const bar = obj(new THREE.BoxGeometry(0.28, 0.06, 0.06), mat)
        bar.position.x = 0.14; hg.add(bar)
        hg.rotation.y = a; hg.position.set(Math.sin(a) * 0.56, 0.2, Math.cos(a) * 0.56)
        g.add(hg)
      })
      // Lid
      const lid = new THREE.Group()
      lid.add(obj(new THREE.CylinderGeometry(0.51, 0.51, 0.07, 32), mat))
      const knob = obj(new THREE.SphereGeometry(0.06, 8, 8), mat)
      knob.position.y = 0.065; lid.add(knob)
      lid.position.y = 0.41; lid.name = 'lid'
      g.add(lid)
      return g
    }

    function mkPan() {
      const g = new THREE.Group()
      const mat = M.darkMetal.clone()
      g.add(obj(new THREE.CylinderGeometry(0.62, 0.56, 0.13, 32), mat))
      const h = obj(new THREE.BoxGeometry(0.85, 0.07, 0.07), mat)
      h.position.set(0.84, 0.03, 0); g.add(h)
      return g
    }

    function mkBoard() {
      const g = new THREE.Group()
      g.add(obj(new THREE.BoxGeometry(1.3, 0.05, 0.85), M.wood))
      // Wood grain lines
      for (let i = -0.5; i <= 0.5; i += 0.2) {
        const line = obj(new THREE.BoxGeometry(1.3, 0.001, 0.008), new THREE.MeshStandardMaterial({ color: 0xA8874A }))
        line.position.set(0, 0.026, i)
        g.add(line)
      }
      return g
    }

    function mkKnife() {
      const g = new THREE.Group()
      const blade = obj(new THREE.BoxGeometry(0.045, 0.5, 0.14), new THREE.MeshStandardMaterial({ color: 0xE8E8E8, metalness: 0.95, roughness: 0.05 }))
      g.add(blade)
      const bevel = obj(new THREE.BoxGeometry(0.045, 0.45, 0.02), new THREE.MeshStandardMaterial({ color: 0xF5F5F5, metalness: 0.98 }))
      bevel.position.set(0, 0, -0.08); g.add(bevel)
      const handle = obj(new THREE.BoxGeometry(0.065, 0.32, 0.065), new THREE.MeshStandardMaterial({ color: 0x3B2005, roughness: 0.9 }))
      handle.position.y = -0.41; g.add(handle)
      return g
    }

    function mkBowl() {
      const pts = []
      for (let i = 0; i <= 12; i++) {
        const t = i / 12, a = t * Math.PI * 0.5
        pts.push(new THREE.Vector2(Math.sin(a) * 0.52, -Math.cos(a) * 0.32))
      }
      const g = new THREE.Group()
      g.add(obj(new THREE.LatheGeometry(pts, 32), new THREE.MeshStandardMaterial({ color: 0xFFFFF8, roughness: 0.15 })))
      return g
    }

    function mkPlate() {
      const g = new THREE.Group()
      g.add(obj(new THREE.CylinderGeometry(0.7, 0.65, 0.04, 48), M.white.clone()))
      const rim = obj(new THREE.TorusGeometry(0.66, 0.035, 8, 48), M.white.clone())
      rim.rotation.x = Math.PI / 2; rim.position.y = 0.02; g.add(rim)
      return g
    }

    function obj(geo, mat) {
      const m = new THREE.Mesh(geo, mat)
      m.castShadow = true; m.receiveShadow = true
      return m
    }

    function mkParticle(color, size = 0.035) {
      const m = obj(new THREE.SphereGeometry(size, 6, 6), new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.85 }))
      return m
    }

    // ── Setup functions for each animation type ────────────────────
    const objs = {}

    function setupChop() {
      clearDyn()
      const board = mkBoard(); board.position.set(-0.5, 0.1, 0.3); dynGroup.add(board)
      const vegGeo = new THREE.CylinderGeometry(0.065, 0.05, 0.65, 12)
      const veg = obj(vegGeo, new THREE.MeshStandardMaterial({ color: 0xFF7700 }))
      veg.rotation.z = Math.PI / 2; veg.position.set(-0.5, 0.15, 0.3); dynGroup.add(veg)
      const knife = mkKnife(); knife.position.set(-0.5, 0.7, 0.2); dynGroup.add(knife)
      objs.knife = knife; objs.board = board
      // Chopped pieces
      objs.pieces = []
      for (let i = -0.25; i <= 0.25; i += 0.12) {
        const p = obj(new THREE.CylinderGeometry(0.055, 0.04, 0.1, 12), new THREE.MeshStandardMaterial({ color: 0xFF7700 }))
        p.rotation.z = Math.PI / 2; p.position.set(i - 0.5, 0.14, 0.55); p.visible = false
        dynGroup.add(p); objs.pieces.push(p)
      }
    }

    function setupStir() {
      clearDyn()
      const stovePlat = obj(new THREE.BoxGeometry(0.95, 0.12, 0.95), M.darkMetal.clone())
      stovePlat.position.set(0, 0.06, 0.1); dynGroup.add(stovePlat)
      // Active burner ring
      const burnerMat = new THREE.MeshStandardMaterial({ color: 0xFF3300, emissive: 0xFF2200, emissiveIntensity: 0.7 })
      const burnerRing = obj(new THREE.TorusGeometry(0.34, 0.04, 6, 32), burnerMat)
      burnerRing.rotation.x = Math.PI / 2; burnerRing.position.set(0, 0.13, 0.1); dynGroup.add(burnerRing)
      objs.burner = burnerRing

      const pot = mkPot(); pot.position.set(0, 0.52, 0.1); dynGroup.add(pot)
      objs.pot = pot

      const liquid = obj(new THREE.CylinderGeometry(0.48, 0.48, 0.12, 32), new THREE.MeshStandardMaterial({ color: 0xC4501A, transparent: true, opacity: 0.82 }))
      liquid.position.set(0, 0.87, 0.1); dynGroup.add(liquid)

      // Spoon
      const spoon = new THREE.Group()
      const sHandle = obj(new THREE.CylinderGeometry(0.018, 0.018, 0.85, 8), M.metal.clone())
      sHandle.rotation.z = Math.PI / 7; spoon.add(sHandle)
      const sBowl = obj(new THREE.SphereGeometry(0.065, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.metal.clone())
      sBowl.position.set(-0.24, -0.4, 0); spoon.add(sBowl)
      spoon.position.set(0.28, 1.2, 0.1); dynGroup.add(spoon)
      objs.spoon = spoon

      for (let i = 0; i < 8; i++) addSteam(0, 0.92, 0.1)
    }

    function setupBoil() {
      clearDyn()
      const stovePlat = obj(new THREE.BoxGeometry(0.95, 0.12, 0.95), M.darkMetal.clone())
      stovePlat.position.set(0, 0.06, 0.1); dynGroup.add(stovePlat)

      const burnerMat = new THREE.MeshStandardMaterial({ color: 0xFF2000, emissive: 0xFF1000, emissiveIntensity: 1.0 })
      const burnerCircle = obj(new THREE.CircleGeometry(0.32, 32), burnerMat)
      burnerCircle.rotation.x = -Math.PI / 2; burnerCircle.position.set(0, 0.131, 0.1); dynGroup.add(burnerCircle)
      objs.burner = burnerCircle

      const pot = mkPot()
      // Remove lid for boiling
      const lid = pot.getObjectByName('lid')
      if (lid) pot.remove(lid)
      pot.position.set(0, 0.52, 0.1); dynGroup.add(pot)

      const water = obj(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 32), new THREE.MeshStandardMaterial({ color: 0x4499FF, transparent: true, opacity: 0.72 }))
      water.position.set(0, 0.9, 0.1); dynGroup.add(water)
      objs.water = water

      for (let i = 0; i < 14; i++) {
        const r = Math.random() * 0.32, a = Math.random() * Math.PI * 2
        const bubble = mkParticle(0xAADDFF, 0.018 + Math.random() * 0.025)
        bubble.position.set(Math.sin(a) * r, 0.52 + Math.random() * 0.38, 0.1 + Math.cos(a) * r)
        bubble.userData = { isBubble: true, speed: 0.016 + Math.random() * 0.024, ox: Math.sin(a) * r, oz: 0.1 + Math.cos(a) * r }
        dynGroup.add(bubble); particles.push(bubble)
      }
      for (let i = 0; i < 10; i++) addSteam(0, 0.92, 0.1, true)
    }

    function setupFry() {
      clearDyn()
      const stovePlat = obj(new THREE.BoxGeometry(1.15, 0.12, 1.05), M.darkMetal.clone())
      stovePlat.position.set(0, 0.06, 0.1); dynGroup.add(stovePlat)

      const burnerMat = new THREE.MeshStandardMaterial({ color: 0xFF3300, emissive: 0xFF2200, emissiveIntensity: 0.85 })
      const burnerCircle = obj(new THREE.CircleGeometry(0.38, 32), burnerMat)
      burnerCircle.rotation.x = -Math.PI / 2; burnerCircle.position.set(0, 0.131, 0.1); dynGroup.add(burnerCircle)
      objs.burner = burnerCircle

      const pan = mkPan(); pan.position.set(0, 0.22, 0.1); dynGroup.add(pan)
      objs.pan = pan

      const oil = obj(new THREE.CylinderGeometry(0.58, 0.58, 0.01, 32), new THREE.MeshStandardMaterial({ color: 0xFFDD88, transparent: true, opacity: 0.45, metalness: 0.2 }))
      oil.position.set(0, 0.295, 0.1); dynGroup.add(oil)

      const foodColors = [0xFF6B35, 0xFFCC44, 0x88BB44, 0xFF4444, 0xFFAA44, 0xEE7722]
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2, r = 0.18 + Math.random() * 0.22
        const food = obj(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshStandardMaterial({ color: foodColors[i] }))
        food.position.set(Math.sin(a) * r, 0.3, 0.1 + Math.cos(a) * r)
        food.userData = { baseY: 0.3, phase: (i / 6) * Math.PI * 2 }
        dynGroup.add(food); particles.push(food)
      }
      for (let i = 0; i < 14; i++) {
        const sizzle = mkParticle(0xFF8800, 0.012)
        sizzle.position.set((Math.random() - 0.5) * 0.9, 0.31 + Math.random() * 0.35, 0.1 + (Math.random() - 0.5) * 0.8)
        sizzle.userData = { isSizzle: true, speed: 0.022 + Math.random() * 0.03, vx: (Math.random() - 0.5) * 0.018, vz: (Math.random() - 0.5) * 0.018 }
        dynGroup.add(sizzle); particles.push(sizzle)
      }
    }

    function setupMix() {
      clearDyn()
      const bowl = mkBowl(); bowl.position.set(-0.2, 0.1, 0.2); dynGroup.add(bowl); objs.bowl = bowl
      const colors = [0xFFCC44, 0xFF8800, 0x88BB44, 0xFFAAAA, 0x44BBFF, 0xFF4444]
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2, r = 0.08 + Math.random() * 0.2
        const item = obj(new THREE.SphereGeometry(0.04 + Math.random() * 0.04, 8, 6), new THREE.MeshStandardMaterial({ color: colors[i % 6] }))
        item.position.set(Math.sin(a) * r, 0.07 + Math.random() * 0.06, Math.cos(a) * r)
        bowl.add(item)
      }
      // Whisk
      const whisk = new THREE.Group()
      const wHandle = obj(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 8), M.metal.clone())
      wHandle.rotation.z = Math.PI / 10; whisk.add(wHandle)
      for (let i = 0; i < 4; i++) {
        const w = obj(new THREE.TorusGeometry(0.08, 0.01, 6, 12, Math.PI), M.metal.clone())
        w.position.set(-0.15, -0.3 + i * 0.04, 0); w.rotation.z = (i / 4) * Math.PI
        whisk.add(w)
      }
      whisk.position.set(-0.2 + 0.22, 0.65, 0.2 + 0.08); dynGroup.add(whisk); objs.whisk = whisk
    }

    function setupBake() {
      clearDyn()
      const ovenBody = obj(new THREE.BoxGeometry(1.8, 1.4, 0.9), M.metal.clone())
      ovenBody.position.set(0, 0.7, 0.1); dynGroup.add(ovenBody)

      const winMat = new THREE.MeshStandardMaterial({ color: 0xFF7700, emissive: 0xFF5500, emissiveIntensity: 1.2, transparent: true, opacity: 0.75 })
      const ovenWin = obj(new THREE.BoxGeometry(0.9, 0.55, 0.06), winMat)
      ovenWin.position.set(0, 0.78, 0.455); dynGroup.add(ovenWin); objs.ovenWin = ovenWin

      const handle = obj(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 8), new THREE.MeshStandardMaterial({ color: 0xAAAAAA, metalness: 0.9 }))
      handle.rotation.z = Math.PI / 2; handle.position.set(0, 0.39, 0.46); dynGroup.add(handle)

      const dish = obj(new THREE.BoxGeometry(0.75, 0.14, 0.42), new THREE.MeshStandardMaterial({ color: 0x8B4513 }))
      dish.position.set(0, 0.78, 0.1); dynGroup.add(dish)

      for (let i = 0; i < 7; i++) {
        const heat = mkParticle(0xFF8844, 0.028)
        heat.position.set((Math.random() - 0.5) * 0.35, 1.45 + Math.random() * 0.25, 0.1 + (Math.random() - 0.5) * 0.22)
        heat.userData = { isHeat: true, speed: 0.012 + Math.random() * 0.01, phase: Math.random() * Math.PI * 2 }
        dynGroup.add(heat); particles.push(heat)
      }
    }

    function setupPour() {
      clearDyn()
      const bowl = mkBowl(); bowl.position.set(-0.55, 0.1, 0.2); dynGroup.add(bowl)

      const pitcherMat = new THREE.MeshStandardMaterial({ color: 0xDDEEFF, transparent: true, opacity: 0.78, metalness: 0.2 })
      const pitcher = obj(new THREE.CylinderGeometry(0.2, 0.25, 0.52, 20), pitcherMat)
      pitcher.position.set(0.65, 0.7, 0.2); pitcher.rotation.z = -Math.PI / 5.5; dynGroup.add(pitcher); objs.pitcher = pitcher

      // Liquid stream arc
      for (let i = 0; i < 14; i++) {
        const t = i / 13
        const x = 0.62 - t * 1.12, y = 0.68 - t * 0.45 - t * t * 0.28
        const drop = mkParticle(0x4499FF, 0.022)
        drop.position.set(x, y, 0.2)
        drop.userData = { isStream: true, t, initX: x, initY: y, phase: (i / 14) * Math.PI * 2 }
        dynGroup.add(drop); particles.push(drop)
      }
    }

    function setupPlate() {
      clearDyn()
      const plate = mkPlate(); plate.position.set(0, 0.08, 0.2); dynGroup.add(plate); objs.plate = plate
      const colors = [0xFF6B35, 0x88BB44, 0xFFCC44, 0xFF4488, 0xAA8844]
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2
        const food = obj(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshStandardMaterial({ color: colors[i] }))
        food.position.set(Math.sin(a) * 0.3, 0.12, 0.2 + Math.cos(a) * 0.3)
        food.userData = { baseY: 0.12, phase: (i / 5) * Math.PI * 2 }
        dynGroup.add(food); particles.push(food)
      }
      // Garnish
      const g1 = obj(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 8), new THREE.MeshStandardMaterial({ color: 0x33CC33 }))
      g1.position.set(0, 0.19, 0.2); g1.rotation.z = Math.PI / 8; dynGroup.add(g1)
    }

    function setupSeason() {
      clearDyn()
      const pan = mkPan(); pan.position.set(0, 0.15, 0.2); dynGroup.add(pan)
      const food = obj(new THREE.BoxGeometry(0.75, 0.08, 0.42), new THREE.MeshStandardMaterial({ color: 0xC4783A }))
      food.position.set(0, 0.23, 0.2); dynGroup.add(food)

      const shaker = new THREE.Group()
      shaker.add(obj(new THREE.CylinderGeometry(0.055, 0.055, 0.22, 12), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.88 })))
      const cap = obj(new THREE.CylinderGeometry(0.05, 0.055, 0.07, 12), new THREE.MeshStandardMaterial({ color: 0xAAAAAA, metalness: 0.7 }))
      cap.position.y = 0.145; shaker.add(cap)
      shaker.position.set(0.55, 0.6, 0.2); shaker.rotation.z = -Math.PI / 6; dynGroup.add(shaker); objs.shaker = shaker

      for (let i = 0; i < 22; i++) {
        const salt = mkParticle(0xFFFFFF, 0.007)
        salt.position.set(0.2 + (Math.random() - 0.5) * 0.45, 0.24 + Math.random() * 0.38, 0.2 + (Math.random() - 0.5) * 0.22)
        salt.userData = { isSalt: true, speed: 0.009 + Math.random() * 0.011, vx: (Math.random() - 0.5) * 0.006, vz: (Math.random() - 0.5) * 0.006 }
        dynGroup.add(salt); particles.push(salt)
      }
    }

    function setupIdle() {
      clearDyn()
      const pot = mkPot(); pot.position.set(0, 0.12, 0.15); pot.scale.setScalar(0.8); dynGroup.add(pot); objs.pot = pot
      const ingColors = [0xFF6B35, 0xFFCC44, 0x88BB44, 0x4488FF, 0xFF4488, 0x44BBFF, 0xFFAA44, 0xBB44FF]
      const ings = ingredients.slice(0, 8)
      ings.forEach((_, i) => {
        const a = (i / ings.length) * Math.PI * 2, r = 0.85 + Math.sin(i) * 0.15
        const sphere = obj(new THREE.SphereGeometry(0.12, 12, 12), new THREE.MeshStandardMaterial({ color: ingColors[i % ingColors.length], roughness: 0.6 }))
        sphere.position.set(Math.sin(a) * r, 0.22 + Math.cos(i * 0.7) * 0.1, Math.cos(a) * r)
        sphere.userData = { floatPhase: (i / ings.length) * Math.PI * 2, baseY: sphere.position.y }
        dynGroup.add(sphere); particles.push(sphere)
      })
    }

    function addSteam(cx, cy, cz, big = false) {
      const steam = mkParticle(0xDDDDDD, big ? 0.04 : 0.028)
      steam.position.set(cx + (Math.random() - 0.5) * 0.45, cy + Math.random() * 0.3, cz + (Math.random() - 0.5) * 0.45)
      steam.userData = { isSteam: true, speed: 0.013 + Math.random() * 0.018, baseY: cy, phase: Math.random() * Math.PI * 2 }
      dynGroup.add(steam); particles.push(steam)
    }

    function setupAnimation(type) {
      stateRef.current.animationType = type
      switch (type) {
        case 'chop': case 'slice': case 'dice': case 'mince': setupChop(); break
        case 'stir': case 'cook': setupStir(); break
        case 'boil': case 'simmer': setupBoil(); break
        case 'fry': case 'saute': case 'sauté': setupFry(); break
        case 'mix': case 'whisk': case 'blend': setupMix(); break
        case 'bake': case 'roast': setupBake(); break
        case 'pour': case 'add': setupPour(); break
        case 'plate': case 'serve': setupPlate(); break
        case 'season': case 'salt': case 'spice': setupSeason(); break
        default: setupIdle(); break
      }
    }

    stateRef.current.setupFn = setupAnimation
    setupAnimation(stateRef.current.animationType)

    // ── Animation Loop ─────────────────────────────────────────────
    let raf
    const clock = new THREE.Clock()

    function animate() {
      raf = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      const type = stateRef.current.animationType

      switch (type) {
        case 'chop': case 'slice': case 'dice': case 'mince':
          if (objs.knife) {
            objs.knife.position.y = 0.3 + Math.abs(Math.sin(t * 5)) * 0.55
            objs.knife.position.x = -0.5 + Math.sin(t * 5) * 0.03
          }
          break

        case 'stir': case 'cook':
          if (objs.spoon) {
            const a = t * 2.2, r = 0.26
            objs.spoon.position.x = Math.sin(a) * r
            objs.spoon.position.z = 0.1 + Math.cos(a) * r
            objs.spoon.rotation.y = -a
          }
          if (objs.burner) objs.burner.material.emissiveIntensity = 0.5 + Math.sin(t * 4) * 0.15
          particles.forEach(p => {
            if (p.userData.isSteam) {
              p.position.y += p.userData.speed
              p.position.x += Math.sin(t * 2 + p.userData.phase) * 0.003
              const prog = (p.position.y - p.userData.baseY) / 1.0
              p.material.opacity = Math.max(0, 0.8 - prog)
              if (p.position.y > p.userData.baseY + 1.1) { p.position.y = p.userData.baseY; p.material.opacity = 0.8 }
            }
          })
          break

        case 'boil': case 'simmer':
          if (objs.burner) objs.burner.material.emissiveIntensity = 0.9 + Math.sin(t * 6) * 0.1
          if (objs.water) objs.water.position.y = 0.9 + Math.sin(t * 5) * 0.006
          particles.forEach(p => {
            if (p.userData.isBubble) {
              p.position.y += p.userData.speed
              if (p.position.y > 0.97) { p.position.y = 0.52; p.material.opacity = 0.7 }
            }
            if (p.userData.isSteam) {
              p.position.y += p.userData.speed
              p.position.x += Math.sin(t + p.userData.phase) * 0.003
              const prog = (p.position.y - p.userData.baseY) / 1.2
              p.material.opacity = Math.max(0, 0.7 - prog)
              if (p.position.y > p.userData.baseY + 1.3) { p.position.y = p.userData.baseY; p.material.opacity = 0.7 }
            }
          })
          break

        case 'fry': case 'saute': case 'sauté':
          if (objs.burner) objs.burner.material.emissiveIntensity = 0.75 + Math.sin(t * 5) * 0.18
          particles.forEach(p => {
            if (p.userData.isSizzle) {
              p.position.y += p.userData.speed
              p.position.x += p.userData.vx; p.position.z += p.userData.vz
              p.material.opacity = Math.max(0, 1 - (p.position.y - 0.31) / 0.38)
              if (p.position.y > 0.72) {
                p.position.y = 0.32; p.position.x = (Math.random() - 0.5) * 0.75; p.position.z = 0.1 + (Math.random() - 0.5) * 0.75
                p.userData.vx = (Math.random() - 0.5) * 0.018; p.userData.vz = (Math.random() - 0.5) * 0.018
                p.material.opacity = 0.85
              }
            } else if (p.userData.baseY !== undefined) {
              p.position.y = p.userData.baseY + Math.sin(t * 3.5 + p.userData.phase) * 0.012
            }
          })
          break

        case 'mix': case 'whisk': case 'blend':
          if (objs.bowl) objs.bowl.rotation.y = t * 3.5
          if (objs.whisk) { objs.whisk.rotation.y = t * 3.5; objs.whisk.position.x = -0.2 + Math.sin(t * 3.5) * 0.25; objs.whisk.position.z = 0.2 + Math.cos(t * 3.5) * 0.25 }
          break

        case 'bake': case 'roast':
          if (objs.ovenWin) objs.ovenWin.material.emissiveIntensity = 0.9 + Math.sin(t * 1.8) * 0.25
          particles.forEach(p => {
            if (p.userData.isHeat) {
              p.position.y += p.userData.speed
              p.position.x += Math.sin(t * 2.5 + p.userData.phase) * 0.005
              p.material.opacity = Math.max(0, (0.5 - (p.position.y - 1.44) / 0.8))
              if (p.position.y > 2.1) { p.position.y = 1.44; p.position.x = (Math.random() - 0.5) * 0.35; p.material.opacity = 0.5 }
            }
          })
          break

        case 'pour': case 'add':
          if (objs.pitcher) objs.pitcher.rotation.z = -Math.PI / 5.5 + Math.sin(t * 0.7) * 0.06
          particles.forEach(p => {
            if (p.userData.isStream) {
              // Animate along arc
              p.userData.phase += 0.07
              const phase = p.userData.phase % (Math.PI * 2)
              p.material.opacity = 0.5 + Math.sin(phase) * 0.3
            }
          })
          break

        case 'plate': case 'serve':
          if (objs.plate) objs.plate.rotation.y += 0.008
          particles.forEach(p => {
            if (p.userData.baseY !== undefined) p.position.y = p.userData.baseY + Math.sin(t * 1.5 + p.userData.phase) * 0.012
          })
          break

        case 'season': case 'salt': case 'spice':
          if (objs.shaker) objs.shaker.rotation.z = -Math.PI / 6 + Math.sin(t * 2.5) * 0.14
          particles.forEach(p => {
            if (p.userData.isSalt) {
              p.position.y -= p.userData.speed; p.position.x += p.userData.vx; p.position.z += p.userData.vz
              if (p.position.y < 0.22) { p.position.set(0.2 + (Math.random() - 0.5) * 0.4, 0.55 + Math.random() * 0.32, 0.2 + (Math.random() - 0.5) * 0.22) }
            }
          })
          break

        default: // idle
          if (objs.pot) objs.pot.rotation.y = Math.sin(t * 0.5) * 0.05
          particles.forEach(p => {
            if (p.userData.floatPhase !== undefined) {
              p.position.y = p.userData.baseY + Math.sin(t + p.userData.floatPhase) * 0.09
              p.rotation.y += 0.012
            }
          })
          break
      }

      // Subtle fill light flicker
      fillLight.intensity = 0.55 + Math.sin(t * 0.8) * 0.05

      renderer.render(scene, camera)
    }

    resize()
    window.addEventListener('resize', resize)
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, []) // Run once

  // React to animationType / ingredients changes
  useEffect(() => {
    if (stateRef.current.setupFn) {
      stateRef.current.setupFn(animationType)
    }
  }, [animationType, ingredients])

  const label = ANIMATION_LABELS[animationType] || ANIMATION_LABELS.idle

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <div ref={mountRef} className="w-full h-full" style={{ minHeight: 380 }} />
      {/* Animation label overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="anim-badge px-4 py-1.5 rounded-full text-sm font-medium text-amber-300 backdrop-blur-sm">
          {label}
        </div>
      </div>
      {/* Corner decoration */}
      <div className="absolute top-3 right-3 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
    </div>
  )
}
