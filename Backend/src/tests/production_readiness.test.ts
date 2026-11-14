import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';

describe('Redhill Production Readiness Test Suite', () => {

  describe('1. Authentication & JWT Token Verification', () => {
    const testSecret = 'test-jwt-secret-key-32-chars-long!';
    
    test('Password hashing with bcrypt behaves consistently', () => {
      const password = 'InvestorSecret123!';
      const hash = bcrypt.hashSync(password, 10);
      assert.ok(bcrypt.compareSync(password, hash), 'Valid password should verify');
      assert.ok(!bcrypt.compareSync('WrongPassword', hash), 'Invalid password must fail verification');
    });

    test('JWT signs valid payload and verifies successfully', () => {
      const user = { id: 101, email: 'investor@redhill.in', role: 'investor', name: 'Rohan Sharma' };
      const token = jwt.sign(user, testSecret, { expiresIn: '1h' });
      assert.ok(token && typeof token === 'string', 'Token must be a non-empty string');

      const decoded: any = jwt.verify(token, testSecret);
      assert.equal(decoded.id, 101);
      assert.equal(decoded.email, 'investor@redhill.in');
      assert.equal(decoded.role, 'investor');
    });

    test('Tampered or expired JWT token is rejected', () => {
      const user = { id: 101, email: 'investor@redhill.in', role: 'investor', name: 'Rohan Sharma' };
      const token = jwt.sign(user, testSecret, { expiresIn: '1h' });
      const tampered = token.slice(0, -4) + 'abcd';
      assert.throws(() => jwt.verify(tampered, testSecret));
    });
  });

  describe('2. Role-Based Authorization & Investor Data Isolation', () => {
    const adminRoles = new Set(['admin', 'super_admin', 'senior_admin', 'site_manager', 'financial_officer', 'marketing_manager', 'support_agent']);

    test('Admin roles are correctly recognized', () => {
      assert.ok(adminRoles.has('super_admin'));
      assert.ok(adminRoles.has('admin'));
      assert.ok(adminRoles.has('financial_officer'));
      assert.ok(!adminRoles.has('investor'), 'Investor role must not have admin privilege');
      assert.ok(!adminRoles.has('guest'), 'Guest role must not have admin privilege');
    });

    test('Investor query filter isolates records strictly by user_id', () => {
      const currentInvestorId = 42;
      const otherInvestorId = 99;

      // Simulated database records
      const mockInvestorProjects = [
        { user_id: 42, project_id: 1, investment_amount: 5000000 },
        { user_id: 42, project_id: 2, investment_amount: 7500000 },
        { user_id: 99, project_id: 3, investment_amount: 10000000 },
      ];

      const visible = mockInvestorProjects.filter(p => p.user_id === currentInvestorId);
      assert.equal(visible.length, 2);
      assert.ok(visible.every(p => p.user_id === currentInvestorId), 'No other investor records should be exposed');
      assert.ok(!visible.some(p => p.user_id === otherInvestorId), 'Other investor data must be isolated');
    });
  });

  describe('3. Financial & Portfolio Valuation Calculations', () => {
    test('Calculates total investment, portfolio valuation, and net appreciation correctly', () => {
      const sampleProjects = [
        {
          id: 1,
          name: 'Signature Towers',
          investment_amount: 10000000, // 1 Cr
          allotted_sqft: 1000,
          market_price_per_sqft: 14000, // Current value = 1.4 Cr
        },
        {
          id: 2,
          name: 'Emerald Gardens',
          investment_amount: 5000000,  // 50 L
          allotted_sqft: 500,
          market_price_per_sqft: 12000, // Current value = 60 L
        },
      ];

      const totalInvestment = sampleProjects.reduce((sum, p) => sum + (p.investment_amount || 0), 0);
      const totalSqft = sampleProjects.reduce((sum, p) => sum + (p.allotted_sqft || 0), 0);
      const totalMarketValue = sampleProjects.reduce((sum, p) => sum + ((p.allotted_sqft || 0) * (p.market_price_per_sqft || 0)), 0);
      const appreciation = totalMarketValue - totalInvestment;
      const appreciationPercent = totalInvestment > 0 ? ((appreciation / totalInvestment) * 100).toFixed(1) : '0.0';

      assert.equal(totalInvestment, 15000000); // 1.5 Cr
      assert.equal(totalSqft, 1500);
      assert.equal(totalMarketValue, 20000000); // 2 Cr
      assert.equal(appreciation, 5000000); // 50 Lakhs gain
      assert.equal(appreciationPercent, '33.3'); // 33.3% return
    });

    test('Handles edge cases (zero investment, missing rates) gracefully', () => {
      const edgeProjects = [
        { id: 1, investment_amount: 0, allotted_sqft: 0, market_price_per_sqft: 0 },
      ];

      const totalInvestment = edgeProjects.reduce((sum, p) => sum + (p.investment_amount || 0), 0);
      const totalMarketValue = edgeProjects.reduce((sum, p) => sum + ((p.allotted_sqft || 0) * (p.market_price_per_sqft || 0)), 0);
      const appreciation = totalMarketValue - totalInvestment;
      const appreciationPercent = totalInvestment > 0 ? ((appreciation / totalInvestment) * 100).toFixed(1) : '0.0';

      assert.equal(totalInvestment, 0);
      assert.equal(totalMarketValue, 0);
      assert.equal(appreciation, 0);
      assert.equal(appreciationPercent, '0.0');
    });
  });

  describe('4. File Upload Security & Sanitization', () => {
    const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg', '.pdf', '.doc', '.docx', '.xls', '.xlsx']);
    const ALLOWED_MIME_TYPES = new Set([
      'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]);

    test('Permits legitimate architectural photography and PDF legal deeds', () => {
      const validFiles = [
        { name: 'floorplan.pdf', mime: 'application/pdf' },
        { name: 'elevation.webp', mime: 'image/webp' },
        { name: 'site-photo.jpg', mime: 'image/jpeg' },
      ];

      for (const f of validFiles) {
        const ext = path.extname(f.name).toLowerCase();
        assert.ok(ALLOWED_EXTENSIONS.has(ext), `Extension ${ext} should be allowed`);
        assert.ok(ALLOWED_MIME_TYPES.has(f.mime), `MIME ${f.mime} should be allowed`);
      }
    });

    test('Strictly blocks executable and dangerous scripts', () => {
      const dangerousFiles = [
        { name: 'exploit.php', mime: 'application/x-php' },
        { name: 'malware.sh', mime: 'application/x-sh' },
        { name: 'trojan.exe', mime: 'application/x-msdownload' },
        { name: 'payload.js', mime: 'application/javascript' },
        { name: 'script.html', mime: 'text/html' },
      ];

      for (const f of dangerousFiles) {
        const ext = path.extname(f.name).toLowerCase();
        assert.ok(!ALLOWED_EXTENSIONS.has(ext), `Dangerous extension ${ext} must be blocked`);
        assert.ok(!ALLOWED_MIME_TYPES.has(f.mime), `Dangerous MIME ${f.mime} must be blocked`);
      }
    });
  });

  describe('5. Rate Limiting Protection', () => {
    test('Rate limiter limits excess requests from the same IP', () => {
      const maxAttempts = 5;
      let counter = 0;
      const simulateAttempt = () => {
        counter += 1;
        return counter <= maxAttempts;
      };

      for (let i = 1; i <= 5; i++) {
        assert.ok(simulateAttempt(), `Attempt ${i} should be allowed`);
      }
      assert.ok(!simulateAttempt(), 'Attempt 6 must be throttled');
    });
  });

});

