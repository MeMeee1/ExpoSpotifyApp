import * as React from "react"
import Svg, { Mask, Path, G, Defs, Pattern, Use, Image } from "react-native-svg"
import { useColorScheme } from '@/components/useColorScheme';
import Colors from "@/constants/Colors";
const SvgComponent = (props:any) => {
  const theme = useColorScheme(); // 'dark' or 'light'
  const color = theme === 'dark' ? Colors.light.background : Colors.dark.background; // white for dark theme, black for light

  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width={107}
      height={107}
      fill="none"
      {...props}
    >
      <Mask
        id="b"
        width={107}
        height={107}
        x={0}
        y={0}
        maskUnits="userSpaceOnUse"
        style={{
          maskType: "alpha",
        }}
      >
        <Path
          fill="url(#a)"
          d="M0 6.976h100v100H0z"
          transform="rotate(-4 0 6.976)"
        />
      </Mask>
      <G mask="url(#b)">
        <Path fill={color} d="M5 6.976 97.766.279l7.046 100.754-95.767 6.697z" />
      </G>
      <Defs>
        <Pattern
          id="a"
          width={1}
          height={1}
          patternContentUnits="objectBoundingBox"
        >
          <Use xlinkHref="#c" transform="scale(.01)" />
        </Pattern>
        <Image
          xlinkHref="data:image/png;base64,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"
          id="c"
          width={100}
          height={100}
          preserveAspectRatio="none"
        />
      </Defs>
    </Svg>
  )
}

export { SvgComponent as ReactComponent }