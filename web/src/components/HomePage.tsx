import React, { useState } from 'react';
import LoginForm from './LoginForm';
import ChildLogin from './ChildLogin';
import RegisterForm from './RegisterForm';
import child from '../assets/kido.jpeg';
import mother from '../assets/mum.jpeg';
import crypto from '../assets/btc.jpeg';
import btc from '../assets/no.jpeg';

enum AuthView {
  NONE,
  PARENT_LOGIN,
  CHILD_LOGIN,
  REGISTER,
}

const HomePage: React.FC = () => {
  const [currentView, setCurrentView] = useState<AuthView>(AuthView.NONE);

  const renderAuthView = () => {
    switch (currentView) {
      case AuthView.PARENT_LOGIN:
        return (
          <LoginForm
            onRegister={() => setCurrentView(AuthView.REGISTER)}
            onChildLogin={() => setCurrentView(AuthView.CHILD_LOGIN)}
          />
        );
      case AuthView.CHILD_LOGIN:
        return <ChildLogin onBack={() => setCurrentView(AuthView.PARENT_LOGIN)} />;
      case AuthView.REGISTER:
        return <RegisterForm onBack={() => setCurrentView(AuthView.PARENT_LOGIN)} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
{/* 
<img
        src={overlayBg}
        alt="Overlay Background"
        className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay z-0"
      />
  </div> */}
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-8 md:px-12">
        <h1 className="text-5xl font-extrabold font-serif text-yellow-400">SatsJar</h1>
        <div className="space-x-4">
          <button
            className="bg-white text-black px-5 py-2 rounded-lg font-serif hover:bg-gray-300 transition-all duration-200 font-medium"
            onClick={() => setCurrentView(AuthView.REGISTER)}
          >
            Sign up
          </button>
          <button
            className="bg-blue-800 hover:bg-purple-700 px-5 py-2 font-serif text-white rounded-lg font-medium transition-all duration-200"
            onClick={() => setCurrentView(AuthView.PARENT_LOGIN)}
          >
            Log in
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="grid md:grid-cols-2 gap-12 items-center px-6 md:px-12 mb-20">
        <div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold leading-tight mb-6">
            Raising a <span className=" font-serif text-yellow-400">Bitcoin</span> Smart Generation
          </h2>
          <p className="mb-8 font-serif text-gray-300 text-lg">
            The world’s first bitcoin-powered platform where children don’t just learn about money — they experience it!
          </p>
          <p className="mb-8 font-serif text-gray-300 text-lg">
  A revolutionary platform where kids grow their savings in bitcoin — building money habits that last a lifetime.
</p>

          <button
            className="bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-3 font-semibold font-serif rounded-lg transition"
            onClick={() => setCurrentView(AuthView.REGISTER)}
          >
            Get started
          </button>
        </div>
        <div className="grid mb-20 grid-cols-2 gap-4">
          {[child, mother, btc, crypto].map((img, idx) => (
            <img
              key={idx}
              src={img}
              className="w-full h-56 rounded-xl  object-cover hover:scale-105 transition-transform duration-300"
              alt={`hero-img-${idx}`}
            />
          ))}
        </div>
      </section>

      {/* Dashboard Card */}
      <section className="flex justify-center mt-20 mb-20 px-4">
        <div className="relative bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-2xl w-full text-black">
          <div className="absolute inset-0 bg-[url('https://via.placeholder.com/600x400')] bg-cover bg-center rounded-2xl opacity-10 -z-10"></div>
          <h3 className="text-lg font-serif font-semibold mb-1">Wallet</h3>
          <p className="text-2xl font-serif font-bold mb-1">Hello Letim 👋</p>
          <p className="text-sm text-gray-700 mb-6">Ready to start?</p>

          {/* Balance Section */}
          <div className="grid grid-cols-3 gap-4 text-center text-sm font-semibold mb-6">
            <div className="bg-white/80 p-4 rounded-xl shadow-md">
              <p className="text-gray-700 font-serif">My Balance</p>
              <p className="text-xl font-bold">121.00₿</p>
            </div>
            <div className="bg-green-100 p-4 rounded-xl shadow-md">
              <p className="text-gray-700 font-serif">Savings</p>
              <p className="text-xl text-green-600 font-bold">+23.00₿</p>
            </div>
            <div className="bg-red-100 p-4 rounded-xl shadow-md">
              <p className="text-gray-700 font-serif">withdrawals</p>
              <p className="text-xl text-red-600 font-bold">-12.00₿</p>
            </div>
          </div>

          {/* Monthly & Spending */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <p className="text-sm mb-3 font-serif font-medium text-gray-700">Monthly plan</p>
              <div className="flex justify-center items-center h-20">
                <div className="w-16 h-16 rounded-full border-4 border-purple-600 flex items-center justify-center">
                  <span className="text-purple-600 font-serif font-bold">75%</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <p className="text-sm mb-3 font-serif font-medium text-gray-700">Spending frequency</p>
              <div className="flex justify-center items-center h-20">
                <svg width="80" height="40">
                  <polyline
                    fill="none"
                    stroke="orange"
                    strokeWidth="2"
                    points="0,30 10,20 20,25 30,15 40,20 50,10 60,15 70,5"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 px-6 md:px-24 text-center mb-24">
        {[
          {
            icon: '🎮',
            title: 'Fun Learning',
            desc: 'Kids learn about bitcoin with gamified learning.',
          },
          {
            icon: '🏆',
            title: 'Challenge Rewards',
            desc: 'Get achievement and challenge rewards.',
          },
          {
            icon: '⭐',
            title: 'Saving Progress',
            desc: 'Track savings progress in real time!',
          },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="flex font-serif text-3xl flex-col items-center">
            <div className="text-5xl mb-3">{icon}</div>
            <p className="font-semibold text-lg">{title}</p>
            <p className="text-sm text-white">{desc}</p>
          </div>
        ))}
      </section>

      {/* Testimonial + Contact Section */}
      <section className="px-6 align-middle md:px-12">
      <div className="mb-12 flex items-center justify-center">
  <div className="bg-blue-700 rounded-xl align-middle p-6 md:p-8 max-w-xl w-full shadow-lg relative">
    <p className="text-lg font-medium font-serif mb-4 text-white">
      "SatsJar transforms financial education from abstract lessons into hands-on experience with actual bitcoin!"
    </p>
    <div className="flex items-center space-x-4">
      <img
        src="https://randomuser.me/api/portraits/women/44.jpg"
        className="w-10 h-10 rounded-full"
        alt="Sarah Kimberly"
      />
      <div>
        <p className="font-semibold text-white">Sarah Kimberly</p>
        <div className="text-yellow-400">★★★★★</div>
      </div>
    </div>
    <div className="absolute top-0 right-0 w-20 h-20 bg-purple-800 rounded-bl-full"></div>
  </div>
</div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
  <h2 className="text-2xl md:text-3xl font-serif font-semibold mb-4">Questions? Let’s talk</h2>
  <p className="text-gray-400 font-serif mb-6">
    Contact us. We’re always happy to help!
  </p>
  <a
    href="mailto:satsjar@gmail.com?subject=Support Inquiry"
    className="inline-block font-serif bg-yellow-400 text-black px-6 py-3 rounded-lg hover:bg-yellow-300 transition"
  >
    Get started
  </a>
</div>

          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
            alt="Ocean"
            className="rounded-xl shadow-md w-full h-auto object-cover"
          />
        </div>
      </section>

      {/* Modal */}
      {currentView !== AuthView.NONE && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 transition duration-300">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full text-black animate-fadeIn">
            {renderAuthView()}
            <button
              className="mt-4 text-sm text-gray-600 hover:underline"
              onClick={() => setCurrentView(AuthView.NONE)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
