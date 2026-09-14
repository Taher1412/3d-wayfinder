import * as THREE from 'three'
import { palette } from '../models/palette.js'

const FONT = '600 68px "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif'
const post = new THREE.CylinderGeometry(0.07, 0.07, 1, 6).translate(0, 0.5, 0)
const postMaterial = new THREE.MeshStandardMaterial({ color: palette.slate, flatShading: true })

/**
 * A small sign next to a landmark: the only text in the 3D scene.
 * The board turns around its post to face the camera.
 */
export default class NamePlate {
  constructor(name, kind) {
    const accent = kind === 'admin' ? palette.red : palette.blue
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.font = FONT
    const height = 128
    const pad = 44
    const stripe = 18
    const width = Math.ceil(ctx.measureText(name).width + pad * 2 + stripe)
    canvas.width = width
    canvas.height = height

    ctx.fillStyle = palette.white
    ctx.beginPath()
    ctx.roundRect(4, 4, width - 8, height - 8, 22)
    ctx.fill()
    ctx.strokeStyle = palette.ink
    ctx.globalAlpha = 0.15
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.fillStyle = accent
    ctx.fillRect(26, 26, stripe - 8, height - 52)
    ctx.font = FONT
    ctx.fillStyle = palette.ink
    ctx.textBaseline = 'middle'
    ctx.fillText(name, pad + stripe, height / 2 + 4)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4

    const boardHeight = 1.25
    const boardWidth = (boardHeight * width) / height
    this.board = new THREE.Mesh(
      new THREE.PlaneGeometry(boardWidth, boardHeight),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false })
    )
    this.board.position.y = 2.6

    this.group = new THREE.Group()
    const pole = new THREE.Mesh(post, postMaterial)
    pole.scale.y = 2.1
    this.group.add(pole, this.board)
  }

  /** Yaw towards the camera. The sign sits directly in the scene, so local = world. */
  update(camera) {
    const { position } = this.group
    this.group.rotation.y = Math.atan2(camera.position.x - position.x, camera.position.z - position.z)
  }
}
