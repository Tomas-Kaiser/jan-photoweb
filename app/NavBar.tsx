import { faInstagram, faFacebook } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'

const NavBar = () => {
    return (
        <div className="navbar bg-base-100 shadow-sm">
            <div className="navbar-start">
                <a className="btn btn-ghost text-xl">HOME</a>
                <a
                    href="https://www.facebook.com/share/jpVp8s9n6sw2aGfd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-circle"
                >
                    <FontAwesomeIcon icon={faFacebook} className="w-6 h-6 text-pink-500" />
                </a>
                <a
                    href="https://www.instagram.com/yenhighjack/?igsh=Yzl0eW1wMGkxN3po&utm_source=qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-circle"
                >
                    <FontAwesomeIcon icon={faInstagram} className="w-6 h-6 text-pink-500" />
                </a>
            </div>
            <div className="navbar-center hidden lg:flex">
                <p>Jan</p>
            </div>
            <div className="navbar-end">
                <ul className="menu menu-horizontal px-1 hidden lg:flex">
                    <li><a>Item 1</a></li>
                    <li>
                        <details>
                            <summary>Parent</summary>
                            <ul className="p-2">
                                <li><a>Submenu 1</a></li>
                                <li><a>Submenu 2</a></li>
                            </ul>
                        </details>
                    </li>
                    <li><a>Item 3</a></li>
                </ul>
                <div className="dropdown lg:hidden">
                    <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /> </svg>
                    </div>
                    <ul
                        tabIndex={0}
                        className="menu dropdown-content absolute right-0 bg-base-100 rounded-box mt-3 w-52 p-2 shadow z-50"
                    >
                        <li><a>Item 1</a></li>
                        <li>
                            <a>Parent</a>
                            <ul className="p-2">
                                <li><a>Submenu 1</a></li>
                                <li><a>Submenu 2</a></li>
                            </ul>
                        </li>
                        <li><a>Item 3</a></li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default NavBar