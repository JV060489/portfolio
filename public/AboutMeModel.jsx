import React, { useRef, useMemo, useContext, createContext } from "react";
import { useGLTF, Merged } from "@react-three/drei";

const context = createContext();
export function Instances({ children, ...props }) {
  const { nodes } = useGLTF("/LightsModel.glb");
  const instances = useMemo(
    () => ({
      Rock: nodes.Rock_1,
      Rock1: nodes.Rock_2,
      Rock2: nodes.Rock_3,
      Rock3: nodes.Rock_4,
      Cube2: nodes.Cube001,
      Cube3: nodes.Cube,
      Icosphere: nodes.Icosphere,
      NurbsPath: nodes.NurbsPath,
      Cube4: nodes.Cube004,
      Sphere: nodes.Sphere,
      Plane: nodes.Plane,
      Plane1: nodes.Plane001,
      Plane2: nodes.Plane011,
      Plane3: nodes.Plane013,
    }),
    [nodes],
  );
  return (
    <Merged meshes={instances} {...props}>
      {(instances) => (
        <context.Provider value={instances}>{children}</context.Provider>
      )}
    </Merged>
  );
}

export function AboutMeModel(props) {
  const instances = useContext(context);
  const { nodes, materials } = useGLTF("/LightsModel.glb");
  return (
    <group {...props} dispose={null}>
      <group scale={[1.334, 0.412, 1.334]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Cube001_1.geometry}
          material={materials["Material.003"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Cube001_2.geometry}
          material={materials.Ground}
        />
      </group>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Bike_mesh.geometry}
        material={materials.Bike_mat1}
        position={[-0.878, 0.419, -0.533]}
        rotation={[-0.123, 0.442, 0.058]}
        scale={0.078}
      />
      <group
        position={[-0.071, 0.423, -0.804]}
        rotation={[0, 1.079, 0]}
        scale={0.135}
      >
        <mesh
          castShadow
          receiveShadow
          geometry={nodes["a-Mesh"].geometry}
          material={materials.lambert4SG}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes["a-Mesh_1"].geometry}
          material={materials["Material.004"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes["a-Mesh_2"].geometry}
          material={materials["lambert4SG.002"]}
        />
      </group>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Base.geometry}
        material={materials["Blue Colour"]}
        position={[0.026, 0.444, -0.025]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[0.462, 0.041, 0.757]}
      >
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.ConcreteBase.geometry}
          material={materials.Concrete}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.FountainTop.geometry}
          material={materials.Pink}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Fouontain.geometry}
          material={materials.LightYellow}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.GrassBase.geometry}
          material={materials["Grass.001"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Water.geometry}
          material={materials.Water}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.WaterChannelSeperator.geometry}
          material={materials.Pipes}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle014.geometry}
          material={materials.Yellow}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle014_1.geometry}
          material={materials.White}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle014_2.geometry}
          material={materials["Material.001"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle014_3.geometry}
          material={materials.Green}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle014_4.geometry}
          material={materials["Blue Colour"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle008.geometry}
          material={materials["White.001"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Circle008_1.geometry}
          material={materials.Black}
        />
      </mesh>
      <group
        position={[-0.839, 0.377, -0.925]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={24.356}
      >
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.NormalTree_1001.geometry}
          material={materials.NormalTree_Bark}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.NormalTree_1001_1.geometry}
          material={materials.NormalTree_Leaves}
        />
      </group>
      <group
        position={[0.754, 0.365, -0.672]}
        rotation={[-Math.PI / 2, 0, 0.249]}
        scale={31.692}
      >
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.NormalTree_3001.geometry}
          material={materials.NormalTree_Bark}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.NormalTree_3001_1.geometry}
          material={materials.NormalTree_Leaves}
        />
      </group>
      <group
        position={[1.135, 0.362, 0.222]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={30.238}
      >
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.NormalTree_5001_1.geometry}
          material={materials.NormalTree_Bark}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.NormalTree_5001_2.geometry}
          material={materials.NormalTree_Leaves}
        />
      </group>
      <group
        position={[1.142, 0.362, -0.393]}
        rotation={[-Math.PI / 2, 0, 1.12]}
        scale={21.873}
      >
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.NormalTree_5002_1.geometry}
          material={materials.NormalTree_Bark}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.NormalTree_5002_2.geometry}
          material={materials.NormalTree_Leaves}
        />
      </group>
      <group
        position={[0.081, 0.365, -1.076]}
        rotation={[-Math.PI / 2, 0, -2.994]}
        scale={31.817}
      >
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.NormalTree_3002.geometry}
          material={materials.NormalTree_Bark}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.NormalTree_3002_1.geometry}
          material={materials.NormalTree_Leaves}
        />
      </group>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Geo_Deer.geometry}
        material={materials.lambert2SG}
        position={[0.219, 0.508, 0.827]}
        rotation={[0, -0.73, 0]}
        scale={0.001}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Geo_Deer001.geometry}
        material={materials.lambert2SG}
        position={[0.911, 0.557, 0.007]}
        scale={0.001}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Geo_Deer002.geometry}
        material={materials.lambert2SG}
        position={[-0.769, 0.555, 0.025]}
        rotation={[Math.PI, -0.625, Math.PI]}
        scale={0.001}
      />
      <instances.Rock
        position={[-1.184, 0.198, 1.156]}
        scale={[0.03, 0.04, 0.029]}
      />
      <instances.Rock1
        position={[0.038, 0.123, 1.308]}
        rotation={[-0.03, -0.45, -1.212]}
        scale={[0.039, 0.051, 0.037]}
      />
      <instances.Rock2
        position={[1.342, 0.16, 0.79]}
        rotation={[1.902, -0.476, 2.111]}
        scale={[0.033, 0.044, 0.032]}
      />
      <instances.Rock3
        position={[1.063, 0.256, 1.302]}
        rotation={[-3.114, 0.197, 1.937]}
        scale={[0.008, 0.011, 0.008]}
      />
      <instances.Rock1
        position={[0.204, 0.194, 1.318]}
        rotation={[0.048, -0.215, -0.76]}
        scale={[0.044, 0.058, 0.042]}
      />
      <instances.Rock
        position={[0.506, 0.429, 0.587]}
        rotation={[-2.031, -0.81, -0.628]}
        scale={[0.008, 0.01, 0.007]}
      />
      <instances.Rock2
        position={[0.624, 0.232, 1.324]}
        rotation={[2.333, 1.516, 1.417]}
        scale={[0.027, 0.036, 0.03]}
      />
      <instances.Rock3
        position={[0.318, 0.103, 1.322]}
        rotation={[-3.114, 0.197, 1.937]}
        scale={[0.019, 0.024, 0.018]}
      />
      <instances.Rock2
        position={[1.126, 0.194, 1.279]}
        rotation={[-3.096, 0.928, 1.906]}
        scale={[0.054, 0.06, 0.042]}
      />
      <instances.Rock3
        position={[1.023, 0.194, 1.313]}
        rotation={[-3.114, 0.197, 1.937]}
        scale={[0.009, 0.012, 0.009]}
      />
      <instances.Rock3
        position={[1.072, 0.209, 1.297]}
        rotation={[1.565, -1.059, -2.261]}
        scale={[0.009, 0.012, 0.009]}
      />
      <instances.Rock3
        position={[1.072, 0.159, 1.297]}
        rotation={[1.565, -1.059, -2.261]}
        scale={[0.009, 0.012, 0.009]}
      />
      <instances.Rock3
        position={[1.321, 0.191, 0.896]}
        rotation={[-3.06, -1.228, 2.02]}
        scale={[0.029, 0.038, 0.028]}
      />
      <instances.Rock2
        position={[1.342, 0.16, 0.661]}
        rotation={[2.29, -0.533, 1.852]}
        scale={[0.033, 0.044, 0.032]}
      />
      <instances.Rock3
        position={[1.324, 0.194, 0.332]}
        rotation={[-2.606, 0.147, 2.723]}
        scale={[0.023, 0.03, 0.021]}
      />
      <instances.Rock3
        position={[1.304, 0.228, 1.067]}
        rotation={[-2.606, 0.147, 2.723]}
        scale={[0.005, 0.006, 0.004]}
      />
      <instances.Rock3
        position={[1.296, 0.163, 1.09]}
        rotation={[-2.606, 0.147, 2.723]}
        scale={[0.005, 0.006, 0.004]}
      />
      <instances.Rock3
        position={[1.308, 0.201, 1.065]}
        rotation={[-2.606, 0.147, 2.723]}
        scale={[0.005, 0.006, 0.004]}
      />
      <instances.Rock3
        position={[1.323, 0.182, 0.072]}
        rotation={[-0.069, 0.938, 3.025]}
        scale={[0.03, 0.04, 0.029]}
      />
      <instances.Rock3
        position={[1.282, 0.074, 0.072]}
        rotation={[-0.227, 1.029, -1.816]}
        scale={[0.03, 0.04, 0.029]}
      />
      <instances.Rock3
        position={[0.845, 0.157, 1.336]}
        rotation={[-2.349, -0.44, 2.113]}
        scale={[0.003, 0.004, 0.003]}
      />
      <instances.Rock3
        position={[0.342, 0.191, 1.307]}
        rotation={[-2.606, 0.147, 2.723]}
        scale={[-0.012, -0.015, -0.011]}
      />
      <instances.Rock3
        position={[0.835, 0.168, 1.335]}
        rotation={[-2.448, -0.096, 2.436]}
        scale={[0.003, 0.003, 0.002]}
      />
      <instances.Rock3
        position={[0.869, 0.167, 1.337]}
        rotation={[-2.388, -0.254, 2.284]}
        scale={[0.003, 0.004, 0.003]}
      />
      <instances.Rock3
        position={[0.848, 0.175, 1.336]}
        rotation={[-2.682, 0.223, 2.84]}
        scale={[0.003, 0.004, 0.003]}
      />
      <instances.Rock3
        position={[0.931, 0.192, 1.33]}
        rotation={[-2.388, -0.254, 2.284]}
        scale={[0.003, 0.004, 0.003]}
      />
      <instances.Rock3
        position={[0.931, 0.199, 1.325]}
        rotation={[-2.388, -0.254, 2.284]}
        scale={[0.003, 0.004, 0.003]}
      />
      <instances.Rock3
        position={[0.942, 0.16, 1.33]}
        rotation={[-2.388, -0.254, 2.284]}
        scale={[0.003, 0.004, 0.003]}
      />
      <instances.Rock1
        position={[1.338, 0.175, -0.233]}
        rotation={[1.629, -0.035, -2.637]}
        scale={[0.052, 0.068, 0.049]}
      />
      <instances.Rock1
        position={[1.345, 0.175, -0.438]}
        rotation={[-2.968, -0.682, 3.009]}
        scale={[0.033, 0.044, 0.032]}
      />
      <instances.Rock1
        position={[1.348, 0.207, -0.499]}
        rotation={[-0.511, -0.774, -2.917]}
        scale={[0.018, 0.023, 0.017]}
      />
      <instances.Rock
        position={[-0.652, 0.198, 1.286]}
        rotation={[-0.348, -0.082, 0.489]}
        scale={[0.03, 0.04, 0.029]}
      />
      <instances.Rock
        position={[-1.268, 0.198, 0.957]}
        rotation={[2.661, -0.766, 0.483]}
        scale={[0.03, 0.04, 0.029]}
      />
      <instances.Rock
        position={[-1.26, 0.173, 0.88]}
        rotation={[1.656, -0.613, 0.179]}
        scale={[0.049, 0.065, 0.047]}
      />
      <instances.Rock
        position={[-1.271, 0.124, 0.945]}
        rotation={[-2.525, 0.485, 2.382]}
        scale={[0.03, 0.04, 0.029]}
      />
      <instances.Rock1
        position={[-0.438, 0.173, 1.296]}
        rotation={[-0.03, -0.45, -1.212]}
        scale={[0.085, 0.112, 0.081]}
      />
      <instances.Rock
        position={[-1.297, 0.173, 0.211]}
        rotation={[0.334, -0.917, -0.57]}
        scale={[0.072, 0.095, 0.068]}
      />
      <instances.Rock
        position={[-1.309, 0.221, 0.077]}
        rotation={[0.334, -0.917, -0.57]}
        scale={[0.019, 0.025, 0.018]}
      />
      <instances.Rock
        position={[-1.309, 0.243, 0.129]}
        rotation={[0.334, -0.917, -0.57]}
        scale={[0.019, 0.025, 0.018]}
      />
      <instances.Rock
        position={[-1.307, 0.165, 0.066]}
        rotation={[-1.379, -0.717, -0.745]}
        scale={[0.019, 0.025, 0.018]}
      />
      <instances.Rock1
        position={[-1.315, 0.194, 0.532]}
        rotation={[-0.03, -0.45, -1.212]}
        scale={[0.016, 0.022, 0.016]}
      />
      <instances.Rock1
        position={[-1.328, 0.194, -0.925]}
        rotation={[-0.682, -0.405, -1.489]}
        scale={[0.022, 0.028, 0.02]}
      />
      <instances.Rock1
        position={[-1.341, 0.196, -0.877]}
        rotation={[-0.682, -0.405, -1.489]}
        scale={[0.022, 0.028, 0.02]}
      />
      <instances.Rock1
        position={[-1.314, 0.149, -0.89]}
        rotation={[-0.682, -0.405, -1.489]}
        scale={[0.022, 0.028, 0.02]}
      />
      <instances.Rock1
        position={[-1.32, 0.144, -0.943]}
        rotation={[-2.582, 0.113, -1.95]}
        scale={[0.022, 0.028, 0.02]}
      />
      <instances.Rock
        position={[-1.283, 0.165, -0.292]}
        rotation={[-2.044, -0.901, -0.702]}
        scale={[0.036, 0.042, 0.019]}
      />
      <instances.Rock
        position={[0.481, 0.198, -1.348]}
        rotation={[0.349, -0.229, -0.796]}
        scale={[0.03, 0.04, 0.029]}
      />
      <instances.Rock
        position={[0.641, 0.158, -1.341]}
        rotation={[0.471, -0.507, -1.73]}
        scale={[0.057, 0.075, 0.054]}
      />
      <instances.Rock
        position={[-0.431, 0.191, -1.35]}
        rotation={[0.471, -0.507, -1.73]}
        scale={[0.057, 0.075, 0.054]}
      />
      <instances.Rock
        position={[0.061, 0.065, -1.244]}
        rotation={[-1.406, 1.253, -2.605]}
        scale={[0.057, 0.075, 0.054]}
      />
      <instances.Rock
        position={[-1.003, 0.158, -1.325]}
        rotation={[0.205, 0.193, -0.879]}
        scale={[0.039, 0.052, 0.037]}
      />
      <instances.Rock
        position={[1.23, 0.191, -1.145]}
        rotation={[0.973, -0.843, 2.904]}
        scale={[0.057, 0.075, 0.054]}
      />
      <instances.Rock
        position={[0.475, 0.433, 0.619]}
        rotation={[-2.431, 0.329, -1.869]}
        scale={[0.009, 0.012, 0.009]}
      />
      <instances.Rock
        position={[0.478, 0.429, 0.587]}
        rotation={[-2.031, -0.81, -0.628]}
        scale={[0.008, 0.01, 0.007]}
      />
      <instances.Rock
        position={[-0.082, 0.429, 0.659]}
        rotation={[-0.675, 0.153, 1.665]}
        scale={[0.008, 0.01, 0.007]}
      />
      <instances.Rock
        position={[-0.038, 0.433, 0.668]}
        rotation={[-1.355, -0.886, 0.248]}
        scale={[0.009, 0.012, 0.009]}
      />
      <instances.Rock
        position={[-0.066, 0.429, 0.683]}
        rotation={[-0.675, 0.153, 1.665]}
        scale={[0.008, 0.01, 0.007]}
      />
      <instances.Rock
        position={[-1.212, 0.402, 0.119]}
        rotation={[-0.9, -0.662, 0.885]}
        scale={[0.008, 0.011, 0.008]}
      />
      <instances.Rock
        position={[-1.198, 0.407, 0.167]}
        rotation={[-2.363, -0.496, -1.158]}
        scale={[0.01, 0.013, 0.01]}
      />
      <instances.Rock
        position={[-1.226, 0.402, 0.146]}
        rotation={[-0.9, -0.662, 0.885]}
        scale={[0.008, 0.011, 0.008]}
      />
      <instances.Rock
        position={[-0.64, 0.426, -1.063]}
        rotation={[-1.382, -0.496, -0.229]}
        scale={[0.014, 0.018, 0.013]}
      />
      <instances.Rock
        position={[-0.678, 0.424, -0.991]}
        rotation={[-2.198, 0.403, -1.401]}
        scale={[0.017, 0.022, 0.016]}
      />
      <instances.Rock
        position={[-0.686, 0.44, -1.047]}
        rotation={[-1.382, -0.496, -0.229]}
        scale={[0.014, 0.018, 0.013]}
      />
      <instances.Cube2 position={[0.894, 0.443, 1.044]} scale={0.027}>
        <instances.Cube3
          position={[-4.921, 32.193, -8.299]}
          rotation={[0, 0.545, 0]}
          scale={0.555}
        />
        <instances.Icosphere
          position={[-5.066, 31.668, -8.67]}
          rotation={[0, 0.345, 0]}
          scale={[0.748, 0.748, 1.056]}
        />
        <instances.NurbsPath
          position={[-1.332, -0.033, -1.609]}
          rotation={[0, 0, -Math.PI / 2]}
          scale={4.455}
        />
      </instances.Cube2>
      <instances.Cube2
        position={[-0.755, 0.443, -0.761]}
        rotation={[-Math.PI, 0.113, -Math.PI]}
        scale={0.027}
      >
        <instances.Cube3
          position={[-4.921, 32.193, -8.299]}
          rotation={[0, 0.545, 0]}
          scale={0.555}
        />
        <instances.Icosphere
          position={[-5.066, 31.668, -8.67]}
          rotation={[0, 0.345, 0]}
          scale={[0.748, 0.748, 1.056]}
        />
        <instances.NurbsPath
          position={[-1.332, -0.033, -1.609]}
          rotation={[0, 0, -Math.PI / 2]}
          scale={4.455}
        />
      </instances.Cube2>
      <group
        position={[-0.515, 0.579, 0.894]}
        rotation={[-0.071, -1.34, -0.083]}
        scale={[1, 1.181, 1]}
      >
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box32979_1.geometry}
          material={materials._crayfishdiffuse}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box32979_1_1.geometry}
          material={materials["03___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box32979_1_2.geometry}
          material={materials["02___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box32979_1_3.geometry}
          material={materials["07___Default"]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Text.geometry}
          material={materials["03___Default"]}
          position={[-0.044, 0.011, 0.593]}
          rotation={[1.58, -0.009, -1.13]}
          scale={[0.036, 0.041, 0.034]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Text001.geometry}
          material={materials["03___Default"]}
          position={[-0.21, 0.024, -0.081]}
          rotation={[1.562, 0.01, 2.026]}
          scale={[0.036, 0.041, 0.034]}
        />
      </group>
      <instances.Cube4
        position={[-1.075, 0.556, 0.592]}
        rotation={[0, -0.277, 0]}
        scale={[0.013, 0.012, 0.02]}
      />
      <instances.Cube4
        position={[-1.145, 0.556, 0.921]}
        rotation={[0, -0.277, 0]}
        scale={[0.013, 0.012, 0.02]}
      />
      <instances.Sphere
        position={[0.767, 0.466, 0.242]}
        rotation={[0, 0.529, 0]}
        scale={0.018}
      />
      <instances.Plane
        position={[0.756, 0.482, 0.253]}
        rotation={[0.109, -0.209, 0.078]}
        scale={0.01}
      />
      <instances.Plane1
        position={[0.778, 0.479, 0.256]}
        rotation={[0.715, 1.454, -0.709]}
        scale={0.01}
      />
      <instances.Plane
        position={[0.78, 0.482, 0.242]}
        rotation={[2.946, 0.993, -2.921]}
        scale={0.01}
      />
      <instances.Plane1
        position={[0.766, 0.479, 0.224]}
        rotation={[3.043, -0.688, 3.081]}
        scale={0.01}
      />
      <instances.Plane
        position={[0.775, 0.476, 0.253]}
        rotation={[0.43, 1.313, -0.362]}
        scale={0.01}
      />
      <instances.Plane1
        position={[0.778, 0.473, 0.23]}
        rotation={[3.065, 0.113, -3.131]}
        scale={0.01}
      />
      <instances.Plane
        position={[0.757, 0.482, 0.232]}
        rotation={[2.898, -1.113, 2.978]}
        scale={0.01}
      />
      <instances.Plane1
        position={[0.746, 0.473, 0.241]}
        rotation={[0.123, -0.902, 0.099]}
        scale={0.01}
      />
      <instances.Plane1
        position={[0.767, 0.479, 0.262]}
        rotation={[0.109, 0.791, -0.075]}
        scale={0.01}
      />
      <instances.Plane1
        position={[0.754, 0.473, 0.262]}
        rotation={[0.076, -0.019, 0.004]}
        scale={0.01}
      />
      <instances.Plane
        position={[0.744, 0.47, 0.249]}
        rotation={[0.146, -0.749, 0.155]}
        scale={0.01}
      />
      <instances.Plane2
        position={[0.776, 0.472, 0.301]}
        rotation={[3.065, 0.048, -3.136]}
        scale={0.01}
      />
      <instances.Plane2
        position={[0.753, 0.475, 0.326]}
        rotation={[0.08, -0.29, 0.025]}
        scale={0.01}
      />
      <instances.Plane3
        position={[0.751, 0.472, 0.308]}
        rotation={[0.77, -1.461, 0.77]}
        scale={0.01}
      />
      <instances.Plane3
        position={[0.761, 0.472, 0.3]}
        rotation={[3.009, -0.957, 3.035]}
        scale={0.01}
      />
      <instances.Plane2
        position={[0.747, 0.472, -0.198]}
        rotation={[0.272, -1.283, 0.264]}
        scale={0.01}
      />
      <instances.Plane2
        position={[0.779, 0.475, -0.184]}
        rotation={[1.998, 1.487, -1.997]}
        scale={0.01}
      />
      <instances.Plane3
        position={[0.763, 0.472, -0.176]}
        rotation={[0.083, 0.403, -0.03]}
        scale={0.01}
      />
      <instances.Plane3
        position={[0.752, 0.472, -0.183]}
        rotation={[0.08, -0.283, 0.025]}
        scale={0.01}
      />
      <instances.Plane2
        position={[0.364, 0.472, 0.423]}
        rotation={[0.083, 0.398, -0.03]}
        scale={0.01}
      />
      <instances.Plane2
        position={[0.374, 0.475, 0.39]}
        rotation={[3.064, -0.156, 3.132]}
        scale={0.01}
      />
      <instances.Plane3
        position={[0.383, 0.472, 0.406]}
        rotation={[2.99, 1.04, -3.008]}
        scale={0.01}
      />
      <instances.Plane3
        position={[0.378, 0.472, 0.417]}
        rotation={[0.441, 1.391, -0.433]}
        scale={0.01}
      />
      <instances.Plane2
        position={[-0.429, 0.472, 0.407]}
        rotation={[0.095, -0.63, 0.058]}
        scale={0.01}
      />
      <instances.Plane2
        position={[-0.396, 0.475, 0.399]}
        rotation={[3.023, 0.872, -3.048]}
        scale={0.01}
      />
      <instances.Plane3
        position={[-0.404, 0.472, 0.414]}
        rotation={[0.157, 1.06, -0.134]}
        scale={0.01}
      />
      <instances.Plane3
        position={[-0.416, 0.472, 0.416]}
        rotation={[0.082, 0.375, -0.028]}
        scale={0.01}
      />
      <instances.Plane2
        position={[-0.75, 0.472, -0.264]}
        rotation={[2.523, 1.439, -2.525]}
        scale={0.01}
      />
      <instances.Plane2
        position={[-0.778, 0.475, -0.283]}
        rotation={[2.625, -1.416, 2.633]}
        scale={0.01}
      />
      <instances.Plane3
        position={[-0.761, 0.472, -0.288]}
        rotation={[3.063, -0.234, 3.126]}
        scale={0.01}
      />
      <instances.Plane3
        position={[-0.752, 0.472, -0.28]}
        rotation={[3.057, 0.453, -3.102]}
        scale={0.01}
      />
      <instances.Plane2
        position={[0.578, 0.472, 0.398]}
        rotation={[0.186, -1.146, 0.172]}
        scale={0.01}
      />
      <instances.Plane2
        position={[0.611, 0.475, 0.408]}
        rotation={[2.728, 1.38, -2.733]}
        scale={0.01}
      />
      <instances.Plane3
        position={[0.596, 0.472, 0.417]}
        rotation={[0.089, 0.543, -0.044]}
        scale={0.01}
      />
      <instances.Plane3
        position={[0.584, 0.472, 0.412]}
        rotation={[0.077, -0.143, 0.013]}
        scale={0.01}
      />
      <instances.Sphere
        position={[0.626, 0.466, -0.348]}
        rotation={[0, 0.529, 0]}
        scale={0.018}
      />
      <instances.Plane
        position={[0.614, 0.482, -0.337]}
        rotation={[0.109, -0.209, 0.078]}
        scale={0.01}
      />
      <instances.Plane1
        position={[0.636, 0.479, -0.334]}
        rotation={[0.715, 1.454, -0.709]}
        scale={0.01}
      />
      <instances.Plane
        position={[0.638, 0.482, -0.348]}
        rotation={[2.946, 0.993, -2.921]}
        scale={0.01}
      />
      <instances.Plane1
        position={[0.625, 0.479, -0.366]}
        rotation={[3.043, -0.688, 3.081]}
        scale={0.01}
      />
      <instances.Plane
        position={[0.633, 0.476, -0.337]}
        rotation={[0.43, 1.313, -0.362]}
        scale={0.01}
      />
      <instances.Plane1
        position={[0.636, 0.473, -0.36]}
        rotation={[3.065, 0.113, -3.131]}
        scale={0.01}
      />
      <instances.Plane
        position={[0.616, 0.482, -0.358]}
        rotation={[2.898, -1.113, 2.978]}
        scale={0.01}
      />
      <instances.Plane1
        position={[0.604, 0.473, -0.349]}
        rotation={[0.123, -0.902, 0.099]}
        scale={0.01}
      />
      <instances.Plane1
        position={[0.626, 0.479, -0.328]}
        rotation={[0.109, 0.791, -0.075]}
        scale={0.01}
      />
      <instances.Plane1
        position={[0.612, 0.473, -0.328]}
        rotation={[0.076, -0.019, 0.004]}
        scale={0.01}
      />
      <instances.Plane
        position={[0.603, 0.47, -0.341]}
        rotation={[0.146, -0.749, 0.155]}
        scale={0.01}
      />
      <instances.Sphere
        position={[-0.21, 0.466, -0.527]}
        rotation={[0, 0.529, 0]}
        scale={0.018}
      />
      <instances.Plane
        position={[-0.222, 0.482, -0.516]}
        rotation={[0.109, -0.209, 0.078]}
        scale={0.01}
      />
      <instances.Plane1
        position={[-0.2, 0.479, -0.513]}
        rotation={[0.715, 1.454, -0.709]}
        scale={0.01}
      />
      <instances.Plane
        position={[-0.198, 0.482, -0.526]}
        rotation={[2.946, 0.993, -2.921]}
        scale={0.01}
      />
      <instances.Plane1
        position={[-0.211, 0.479, -0.545]}
        rotation={[3.043, -0.688, 3.081]}
        scale={0.01}
      />
      <instances.Plane
        position={[-0.203, 0.476, -0.516]}
        rotation={[0.43, 1.313, -0.362]}
        scale={0.01}
      />
      <instances.Plane1
        position={[-0.2, 0.473, -0.538]}
        rotation={[3.065, 0.113, -3.131]}
        scale={0.01}
      />
      <instances.Plane
        position={[-0.22, 0.482, -0.536]}
        rotation={[2.898, -1.113, 2.978]}
        scale={0.01}
      />
      <instances.Plane1
        position={[-0.232, 0.473, -0.527]}
        rotation={[0.123, -0.902, 0.099]}
        scale={0.01}
      />
      <instances.Plane1
        position={[-0.21, 0.479, -0.507]}
        rotation={[0.109, 0.791, -0.075]}
        scale={0.01}
      />
      <instances.Plane1
        position={[-0.224, 0.473, -0.507]}
        rotation={[0.076, -0.019, 0.004]}
        scale={0.01}
      />
      <instances.Plane
        position={[-0.233, 0.47, -0.52]}
        rotation={[0.146, -0.749, 0.155]}
        scale={0.01}
      />
      <instances.Plane2
        position={[-0.451, 0.472, -0.431]}
        rotation={[3, -1, 3.024]}
        scale={0.01}
      />
      <instances.Plane2
        position={[-0.44, 0.475, -0.398]}
        rotation={[0.105, 0.759, -0.07]}
        scale={0.01}
      />
      <instances.Plane3
        position={[-0.457, 0.472, -0.405]}
        rotation={[0.084, -0.438, 0.038]}
        scale={0.01}
      />
      <instances.Plane3
        position={[-0.459, 0.472, -0.417]}
        rotation={[0.177, -1.122, 0.162]}
        scale={0.01}
      />
      <instances.Plane2
        position={[-0.846, 0.472, -0.074]}
        rotation={[3.04, -0.715, 3.077]}
        scale={0.01}
      />
      <instances.Plane2
        position={[-0.845, 0.475, -0.04]}
        rotation={[0.086, 0.474, -0.037]}
        scale={0.01}
      />
      <instances.Plane3
        position={[-0.859, 0.472, -0.052]}
        rotation={[0.102, -0.724, 0.07]}
        scale={0.01}
      />
      <instances.Plane3
        position={[-0.857, 0.472, -0.064]}
        rotation={[0.457, -1.397, 0.453]}
        scale={0.01}
      />
      <instances.Plane2
        position={[0.906, 0.472, 0.106]}
        rotation={[3.052, -0.544, 3.098]}
        scale={0.01}
      />
      <instances.Plane2
        position={[0.901, 0.475, 0.139]}
        rotation={[0.08, 0.302, -0.021]}
        scale={0.01}
      />
      <instances.Plane3
        position={[0.889, 0.472, 0.126]}
        rotation={[0.122, -0.895, 0.098]}
        scale={0.01}
      />
      <instances.Plane3
        position={[0.893, 0.472, 0.114]}
        rotation={[1.775, -1.493, 1.778]}
        scale={0.01}
      />
    </group>
  );
}

useGLTF.preload("/LightsModel.glb");
