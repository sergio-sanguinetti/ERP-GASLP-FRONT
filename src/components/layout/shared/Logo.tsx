'use client'

// React Imports
import Image from 'next/image'

const Logo = () => {
  return (
    <div className='flex items-center'>
      <Image
        src='/images/Logo_GAS.png'
        alt='Logo GAS'
        width={160}
        height={40}
        className='object-contain'
        style={{ minWidth: '160px', height: 'auto' }}
      />
    </div>
  )
}

export default Logo
