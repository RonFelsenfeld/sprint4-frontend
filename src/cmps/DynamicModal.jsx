import { useRef } from 'react'
import { useSelector } from 'react-redux'
import 'animate.css'

import { BOTTOM_CENTER, BOTTOM_LEFT, BOTTOM_RIGHT } from '../store/reducers/system.reducer'
import { useClickOutside } from '../customHooks/useClickOutside'

import { DynamicModalContent } from './DynamicModalContent'

export function DynamicModal() {
  const modal = useSelector(storeState => storeState.systemModule.modal)
  const modalRef = useRef()
  const { isOpen, pos, alignment = BOTTOM_CENTER, cmp, targetDimensions, hasCaret = false } = modal
  let classList = ''

  // console.log(modal)

  useClickOutside(modalRef)

  switch (alignment) {
    case BOTTOM_LEFT:
      pos.y += targetDimensions.height
      break

    case BOTTOM_CENTER:
      pos.y += targetDimensions.height
      pos.x = pos.x + targetDimensions.width / 2
      classList += 'centered '
      break

    case BOTTOM_RIGHT:
      pos.x += targetDimensions.width
      pos.y += targetDimensions.height
      break

    default:
      break
  }

  if (hasCaret) classList += ' caret'

  if (!isOpen) return <span></span>
  return (
    <dialog
      ref={modalRef}
      className={`dynamic-modal animate__animated animate__fadeIn ${classList}`}
      style={{ left: pos.x, top: pos.y }}
    >
      <DynamicModalContent {...cmp} />
    </dialog>
  )
}
