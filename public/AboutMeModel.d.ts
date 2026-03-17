import type {
  ForwardRefExoticComponent,
  RefAttributes,
  ReactNode,
} from "react";
import type { ThreeElements } from "@react-three/fiber";
import type * as THREE from "three";

export type AboutMeModelProps = ThreeElements["group"];

export const AboutMeModel: ForwardRefExoticComponent<
  AboutMeModelProps & RefAttributes<THREE.Group>
>;

export function Instances(
  props: AboutMeModelProps & { children?: ReactNode },
): JSX.Element;
