/**
 * Auth controller.
 */
export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  register = async (req, res) => {
    const result = await this.authService.register(req.body);
    res.status(201).json(result);
  };

  login = async (req, res) => {
    const result = await this.authService.login(req.body);
    res.status(200).json(result);
  };

  verifyEmail = async (req, res) => {
    const token = req.body?.token || req.query?.token;
    const result = await this.authService.verifyEmailToken(token);
    res.status(200).json(result);
  };

  resendVerification = async (req, res) => {
    const result = await this.authService.resendVerification(req.body);
    res.status(200).json(result);
  };
}
