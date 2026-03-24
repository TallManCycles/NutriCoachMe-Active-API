import { vi } from 'vitest';

// Silence console output BEFORE importing anything else
vi.stubGlobal('console', {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleStartGoogleOAuth, handleGoogleOAuth, handleRequestGarminToken, handleGarminCallback, oauth2Client, oauth } from '../../controllers/oauthcontroller.js';
import supabase from '../../data/supabase.js';

// Mock console to keep test output clean
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

vi.mock('../../data/supabase.js', () => {
    const supabase = {
        from: vi.fn(),
        insert: vi.fn(),
        select: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    };
    
    // Create a chainable mock
    const chain = {
        from: supabase.from,
        insert: supabase.insert,
        select: supabase.select,
        eq: supabase.eq,
        single: supabase.single,
        update: supabase.update,
        delete: supabase.delete,
        then: (onFulfilled) => Promise.resolve({ data: [{ id: 'mock_id', oauth_token_secret: 'mock_secret' }], error: null }).then(onFulfilled),
    };

    supabase.from.mockReturnValue(chain);
    supabase.insert.mockReturnValue(chain);
    supabase.select.mockReturnValue(chain);
    supabase.eq.mockReturnValue(chain);
    supabase.single.mockReturnValue(chain);
    supabase.update.mockReturnValue(chain);
    supabase.delete.mockReturnValue(chain);

    return { default: supabase };
});

// Mock oauth2Client methods
vi.spyOn(oauth2Client, 'generateAuthUrl').mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth?test=true');
vi.spyOn(oauth2Client, 'getToken').mockResolvedValue({ tokens: { access_token: 'abc', refresh_token: 'def' } });
vi.spyOn(oauth2Client, 'setCredentials').mockImplementation(() => {});

// Mock oauth methods
vi.spyOn(oauth, 'getOAuthRequestToken').mockImplementation((callback) => {
    callback(null, 'requestToken', 'requestTokenSecret');
});
vi.spyOn(oauth, 'getOAuthAccessToken').mockImplementation((token, secret, verifier, callback) => {
    callback(null, 'accessToken', 'accessTokenSecret');
});

describe('OAuth Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            query: {},
            authorisedUser: { id: 'user123' }
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
            redirect: vi.fn().mockReturnThis()
        };
        vi.clearAllMocks();
    });

    describe('handleStartGoogleOAuth', () => {
        it('should return google auth url', async () => {
            req.query.userId = '123';
            await handleStartGoogleOAuth(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ url: expect.stringContaining('accounts.google.com') });
        });
    });

    describe('handleGoogleOAuth', () => {
        it('should exchange code for tokens and redirect', async () => {
            req.query.code = 'some_code';

            await handleGoogleOAuth(req, res);

            expect(oauth2Client.getToken).toHaveBeenCalledWith('some_code');
            expect(supabase.from).toHaveBeenCalledWith('access_tokens');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.redirect).toHaveBeenCalled();
        });

        it('should return 500 if token exchange fails', async () => {
            req.query.code = 'bad_code';
            oauth2Client.getToken.mockRejectedValueOnce(new Error('Exchange failed'));

            await handleGoogleOAuth(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Authentication failed.');
        });
    });

    describe('handleRequestGarminToken', () => {
        it('should return garmin auth url', async () => {
            await handleRequestGarminToken(req, res);

            expect(oauth.getOAuthRequestToken).toHaveBeenCalled();
            expect(supabase.from).toHaveBeenCalledWith('oauth_tokens');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({ url: expect.stringContaining('oauth_token=requestToken') });
        });
    });

    describe('handleGarminCallback', () => {
        it('should exchange garmin tokens and redirect', async () => {
            req.query.oauth_token = 'ot';
            req.query.oauth_verifier = 'ov';

            await handleGarminCallback(req, res);

            expect(oauth.getOAuthAccessToken).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.redirect).toHaveBeenCalled();
        });
    });
});
