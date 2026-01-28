import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import authService from '../services/authService';

// --- Components ---
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

// --- Mocks ---

// 1. Mock the AuthService to avoid real API calls
jest.mock('../services/authService');
const mockedAuthService = authService as jest.Mocked<typeof authService>;

// 2. Mock React Router's useNavigate to track navigation
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

// 3. Mock Window API (Electron IPC)
beforeAll(() => {
  Object.defineProperty(window, 'api', {
    value: {
      openExternalURL: jest.fn(),
      onAuthCallback: jest.fn(),
      removeAuthListener: jest.fn(),
    },
    writable: true,
  });
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LumoFlow Authentication Flow', () => {

  // ====================================================
  // TEST CASE 1: LOGIN SCREEN
  // ====================================================
  describe('LoginScreen', () => {
    test('renders login form and validates input', async () => {
      render(
        <MemoryRouter>
          <LoginScreen setIsAuthenticated={jest.fn()} />
        </MemoryRouter>
      );

      // Check if elements exist
      expect(screen.getByPlaceholderText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
      expect(screen.getByText('LOGIN')).toBeInTheDocument();
    });

    test('successful login navigates to dashboard', async () => {
      const mockSetAuth = jest.fn();
      
      // Mock successful API response
      mockedAuthService.login.mockResolvedValue({
        success: true,
        token: 'fake-token',
        user: { name: 'Test User', email: 'test@example.com' }
      });

      render(
        <MemoryRouter>
          <LoginScreen setIsAuthenticated={mockSetAuth} />
        </MemoryRouter>
      );

      // Fill inputs
      // Note: Your LoginScreen regex requires emails ending in .com
      fireEvent.change(screen.getByPlaceholderText(/Email Address/i), { target: { value: 'user@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'password123' } });

      // Click Login - use getAllByRole and select the submit button (first one)
      const loginBtns = screen.getAllByRole('button', { name: /LOGIN/i });
      fireEvent.click(loginBtns[0]);

      // Assertions
      await waitFor(() => {
        expect(mockedAuthService.login).toHaveBeenCalledWith({
          email: 'user@example.com',
          password: 'password123'
        });
        expect(mockSetAuth).toHaveBeenCalledWith(true);
        expect(mockedNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('displays error on failed login', async () => {
      // Mock failed API response
      mockedAuthService.login.mockResolvedValue({
        success: false,
        msg: 'Invalid credentials'
      });

      render(
        <MemoryRouter>
          <LoginScreen setIsAuthenticated={jest.fn()} />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText(/Email Address/i), { target: { value: 'wrong@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'wrongpass' } });
      
      const loginBtns = screen.getAllByRole('button', { name: /LOGIN/i });
      fireEvent.click(loginBtns[0]);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });
  });

  // ====================================================
  // TEST CASE 2: SIGN UP SCREEN
  // ====================================================
  describe('SignUpScreen', () => {
    test('validates matching passwords and calls signup', async () => {
      mockedAuthService.signup.mockResolvedValue({ success: true });

      render(
        <MemoryRouter>
          <SignUpScreen />
        </MemoryRouter>
      );

      // Fill Inputs
      fireEvent.change(screen.getByPlaceholderText(/Enter your full name/i), { target: { value: 'New User' } });
      fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), { target: { value: 'new@example.com' } });
      
      // Valid Password (needs Upper, Number, Special per your component logic)
      // Get all password fields and use the first one (password field)
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      fireEvent.change(passwordInputs[0], { target: { value: 'Password123!' } });
      
      // Confirm Password - use the second one
      fireEvent.change(passwordInputs[1], { target: { value: 'Password123!' } });

      // Click Sign Up
      const signUpBtn = screen.getByText('SIGN UP →');
      expect(signUpBtn).not.toBeDisabled(); // Should be enabled now
      fireEvent.click(signUpBtn);

      await waitFor(() => {
        expect(mockedAuthService.signup).toHaveBeenCalledWith({
          name: 'New User',
          email: 'new@example.com',
          password: 'Password123!'
        });
        expect(mockedNavigate).toHaveBeenCalledWith('/login');
      });
    });

    test('button is disabled if passwords do not match', () => {
      render(
        <MemoryRouter>
          <SignUpScreen />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText(/Enter your full name/i), { target: { value: 'User' } });
      fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), { target: { value: 'test@example.com' } });
      
      // Mismatch passwords
      const inputs = screen.getAllByPlaceholderText('••••••••');
      fireEvent.change(inputs[0], { target: { value: 'Password123!' } });
      fireEvent.change(inputs[1], { target: { value: 'Mismatch!' } });

      const signUpBtn = screen.getByText('SIGN UP →');
      expect(signUpBtn).toBeDisabled();
    });
  });

  // ====================================================
  // TEST CASE 3: FORGOT PASSWORD SCREEN
  // ====================================================
  describe('ForgotPasswordScreen', () => {
    test('sends reset code successfully', async () => {
      mockedAuthService.forgotPassword.mockResolvedValue({ success: true, msg: 'Code sent' });

      render(
        <MemoryRouter>
          <ForgotPasswordScreen />
        </MemoryRouter>
      );

      // Type email
      const emailInput = screen.getByPlaceholderText(/Enter your registered Email/i);
      fireEvent.change(emailInput, { target: { value: 'forgot@example.com' } });

      // Submit
      const sendBtn = screen.getByText(/SEND RESET CODE/i);
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(mockedAuthService.forgotPassword).toHaveBeenCalledWith('forgot@example.com');
        // Check for success message
        expect(screen.getByText(/Recovery code sent/i)).toBeInTheDocument();
      });

      // Wait for the timeout navigation
      await waitFor(() => {
        expect(mockedNavigate).toHaveBeenCalledWith('/reset-password', { state: { email: 'forgot@example.com' } });
      }, { timeout: 2000 });
    });
  });

});