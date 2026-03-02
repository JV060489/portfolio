"use client"
import React from 'react'
import dynamic from 'next/dynamic'
import ParentCanvas from './_r3fComponents/ParentCanvas'





const RubiksCube = dynamic(() => import('@/app/_r3fComponents/RubiksCube'), {
})

function page() {
  return (
    <main className='relative h-screen bg-[#1a1a2e] '>
      <ParentCanvas/>

    </main>

  )
}

export default page