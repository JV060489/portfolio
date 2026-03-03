"use client"
import React from 'react'
import dynamic from 'next/dynamic'
import ParentCanvas from './_r3fComponents/ParentCanvas'





function page() {
  return (
    <main className='relative h-screen' style={{ background: 'var(--bg, #000000)' }}>
      <ParentCanvas/>

    </main>

  )
}

export default page