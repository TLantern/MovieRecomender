"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const [isHovering, setIsHovering] = React.useState(false);
  
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  // Calculate position for the bubble
  const getBubblePosition = () => {
    if (_values.length === 2) {
      const range = max - min;
      const startPercent = ((_values[0] - min) / range) * 100;
      const endPercent = ((_values[1] - min) / range) * 100;
      const centerPercent = (startPercent + endPercent) / 2;
      return Math.max(5, Math.min(95, centerPercent));
    }
    return 50;
  };

  const bubblePosition = getBubblePosition();

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col group",
        className
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      {...props}
    >
      {/* Year Range Bubble */}
      <div 
        className={`absolute -top-12 transform -translate-x-1/2 bg-white text-black px-3 py-1.5 rounded-lg shadow-lg border border-gray-200 text-sm font-medium whitespace-nowrap z-10 transition-opacity duration-200 ${
          isHovering ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ left: `${bubblePosition}%` }}
      >
        {_values.length === 2 ? `${_values[0]} - ${_values[1]}` : _values[0]}
        {/* Inverted triangle pointer */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
      </div>

      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "bg-gradient-to-r from-red-400 via-red-500 to-red-600 relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "bg-white absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
