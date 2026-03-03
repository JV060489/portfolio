import { extend } from '@react-three/fiber'
import React, { useMemo } from 'react'
import { MeshStandardNodeMaterial } from 'three/webgpu'
import { color } from 'three/tsl'

extend({
    MeshStandardNodeMaterial
})

function Godrays({ 
    ...props
}) {

    const {nodes} = useMemo(()=>{
        return {
            nodes: {
                colorNode: color("red")
            }
        }
    }, [])
  return (
    <mesh {...props}>
        <cylinderGeometry args={[0.4, 2.8, 3.2, 48, 1, true ]} />
        <meshStandardNodeMaterial {...nodes}/>
    </mesh>
  )
}

export default Godrays