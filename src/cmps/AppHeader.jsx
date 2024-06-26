import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

import {
  AboutUs,
  Help,
  Inbox,
  MenuGrid,
  NotificationBell,
  UserImg,
  WorkspaceLogo,
} from '../services/svg.service'
import { BOTTOM_RIGHT } from '../store/reducers/system.reducer'
import { showModal } from '../store/actions/system.actions'
import { logout } from '../store/actions/user.actions'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import { socketService } from '../services/socket-service'
import { AboutUsModal } from './AboutUsModal'

export function AppHeader() {
  const user = useSelector(storeState => storeState.userModule.loggedInUser)
  const [isAboutUsModalOpen, setIsAboutUsModalOpen] = useState(false)
  const navigate = useNavigate()

  function handleAuthClick({ currentTarget }) {
    const cmpInfo = {
      type: 'optionsMenu',
      options: [
        {
          title: `${user ? 'Logout' : 'Login'}`,
          icon: `${user ? 'logout' : 'login'}`,
          func: user ? handleLogout : navigateToLoginPage,
        },
      ],
    }

    function navigateToLoginPage() {
      navigate(`/auth`)
    }

    async function handleLogout() {
      try {
        await logout()
        socketService.logout()
        showSuccessMsg('See you soon!')
      } catch (err) {
        console.log('Logout -> Has issues logging out', err)
        showErrorMsg('Could not logout, try again later')
      } finally {
        navigate('/board')
      }
    }

    showModal(currentTarget, BOTTOM_RIGHT, cmpInfo, false)
  }

  return (
    <header className="app-header flex align-center justify-between">
      <Link to="/">
        <div className="menu-logo-container">
          <div className="logo-container flex align-center">
            <button className="btn-logo">
              <img src="/assets/img/A-logo.png" />
            </button>
            <span className="logo-main">nyday</span>
            <span className="logo-secondary">work management</span>
          </div>
        </div>
      </Link>

      <div className="actions-container flex align-center">
        <button className="btn">
          <NotificationBell />
        </button>

        <button className="btn">
          <Inbox />
        </button>

        <button className="btn">
          <Help />
        </button>

        <button className="btn" onClick={() => setIsAboutUsModalOpen(true)}>
          <AboutUs />
        </button>

        {!user && (
          <button className="btn" onClick={handleAuthClick}>
            <UserImg />
          </button>
        )}

        {user && (
          <div className="user-img-container flex align-center justify-center">
            <img
              src={`${user.imgUrl ? user.imgUrl : '/assets/img/user-avatar.svg'}`}
              alt="User profile picture"
              className="user-img"
              onClick={handleAuthClick}
            />
          </div>
        )}
      </div>

      {isAboutUsModalOpen && <AboutUsModal setIsAboutUsModalOpen={setIsAboutUsModalOpen} />}
    </header>
  )
}
