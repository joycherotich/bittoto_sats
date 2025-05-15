import React, { useState } from 'react';
import LoginForm from './LoginForm';
import ChildLogin from './ChildLogin';
import RegisterForm from './RegisterForm';

enum AuthView {
  PARENT_LOGIN,
  CHILD_LOGIN,
  REGISTER,
}

const HomePage: React.FC = () => {
  const [currentView, setCurrentView] = useState<AuthView>(
    AuthView.PARENT_LOGIN
  );

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
        return (
          <ChildLogin onBack={() => setCurrentView(AuthView.PARENT_LOGIN)} />
        );
      case AuthView.REGISTER:
        return (
          <RegisterForm onBack={() => setCurrentView(AuthView.PARENT_LOGIN)} />
        );
      default:
        return <LoginForm />;
    }
  };

  return (
    <div className='space-y-8 p-4'>
      {/* <div className="text-center">
        <h1 className="text-3xl font-bold">BIT Toto</h1>
        <p className="text-muted-foreground mt-2">
          Learn to save with Bitcoin
        </p>
      </div> */}

      <div className='max-w-md mx-auto'>{renderAuthView()}</div>

      <div className='text-center text-sm text-muted-foreground'>
        <p>Secure Bitcoin savings for children</p>
      </div>
    </div>
  );
};

export default HomePage;
