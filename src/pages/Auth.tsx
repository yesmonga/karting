import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Flag, Mail, Loader2, ArrowLeft, KeyRound, User } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const emailSchema = z.string().email('Email invalide');
const nameSchema = z.string().min(2, 'Minimum 2 caractères');
const codeSchema = z.string().length(6, 'Le code doit contenir 6 caractères');

type AuthStep = 'form' | 'verify';

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; firstName?: string; lastName?: string; code?: string }>({});
  const [signupStep, setSignupStep] = useState<AuthStep>('form');
  const [loginStep, setLoginStep] = useState<AuthStep>('form');

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const validateEmail = () => {
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setErrors(prev => ({ ...prev, email: result.error.errors[0].message }));
      return false;
    }
    setErrors(prev => ({ ...prev, email: undefined }));
    return true;
  };

  const validateFirstName = () => {
    const result = nameSchema.safeParse(firstName.trim());
    if (!result.success) {
      setErrors(prev => ({ ...prev, firstName: result.error.errors[0].message }));
      return false;
    }
    setErrors(prev => ({ ...prev, firstName: undefined }));
    return true;
  };

  const validateLastName = () => {
    const result = nameSchema.safeParse(lastName.trim());
    if (!result.success) {
      setErrors(prev => ({ ...prev, lastName: result.error.errors[0].message }));
      return false;
    }
    setErrors(prev => ({ ...prev, lastName: undefined }));
    return true;
  };

  // ==================== SIGNUP FLOW ====================
  const handleRequestSignupCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailValid = validateEmail();
    const firstNameValid = validateFirstName();
    const lastNameValid = validateLastName();
    if (!emailValid || !firstNameValid || !lastNameValid) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('auth-code', {
        body: { 
          action: 'request_signup_code', 
          email, 
          firstName: firstName.trim(),
          lastName: lastName.trim()
        }
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Code envoyé par email !');
      setSignupStep('verify');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi du code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySignupCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const codeResult = codeSchema.safeParse(code);
    if (!codeResult.success) {
      setErrors(prev => ({ ...prev, code: codeResult.error.errors[0].message }));
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('auth-code', {
        body: { 
          action: 'verify_signup_code', 
          email, 
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          code: code.toUpperCase() 
        }
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      // Auto-login after signup using the token returned
      if (data?.token) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: data.token,
          type: 'magiclink',
        });

        if (verifyError) {
          console.error('Auto-login error:', verifyError);
          toast.error('Compte créé, veuillez vous connecter');
          setSignupStep('form');
          setCode('');
          return;
        }

        toast.success('Compte créé et connecté !');
        navigate('/', { replace: true });
      } else {
        toast.success('Compte créé ! Connectez-vous maintenant.');
        setSignupStep('form');
        setCode('');
      }
    } catch (error: any) {
      console.error('Verify error:', error);
      toast.error(error.message || 'Code invalide ou expiré');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== LOGIN FLOW ====================
  const handleRequestLoginCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('auth-code', {
        body: { action: 'request_login_code', email }
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Code de connexion envoyé par email !');
      setLoginStep('verify');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi du code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyLoginCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const codeResult = codeSchema.safeParse(code);
    if (!codeResult.success) {
      setErrors(prev => ({ ...prev, code: codeResult.error.errors[0].message }));
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('auth-code', {
        body: { action: 'verify_login_code', email, code: code.toUpperCase() }
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      // Use the magic link token to sign in
      if (data?.token) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: data.token,
          type: 'magiclink',
        });

        if (verifyError) {
          console.error('Verify OTP error:', verifyError);
          toast.error('Erreur de connexion');
          return;
        }
      }

      toast.success('Connexion réussie !');
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('Verify login error:', error);
      toast.error(error.message || 'Code invalide ou expiré');
    } finally {
      setIsLoading(false);
    }
  };

  const resetSignup = () => {
    setSignupStep('form');
    setCode('');
    setFirstName('');
    setLastName('');
    setErrors({});
  };

  const resetLogin = () => {
    setLoginStep('form');
    setCode('');
    setErrors({});
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/20 glow-red">
              <Flag className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-racing font-bold gradient-text-racing">
              DNF KART
            </h1>
          </div>
          <p className="text-muted-foreground">
            Analysez vos performances de course
          </p>
        </div>

        <Card className="glass-card border-border/50">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" onClick={resetLogin}>Connexion</TabsTrigger>
                <TabsTrigger value="register" onClick={resetSignup}>Inscription</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* ==================== LOGIN TAB ==================== */}
              <TabsContent value="login" className="mt-0">
                {loginStep === 'form' ? (
                  <form onSubmit={handleRequestLoginCode} className="space-y-4">
                    <CardTitle className="text-xl">Connexion</CardTitle>
                    <CardDescription>
                      Entrez votre email pour recevoir un code de connexion
                    </CardDescription>

                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="votre@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full glow-red-subtle"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Envoi du code...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Recevoir le code
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyLoginCode} className="space-y-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetLogin}
                      className="mb-2 -ml-2"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Retour
                    </Button>
                    
                    <CardTitle className="text-xl">Vérification</CardTitle>
                    <CardDescription>
                      Entrez le code à 6 caractères reçu par email à <span className="font-medium text-primary">{email}</span>
                    </CardDescription>

                    <div className="space-y-4 pt-2">
                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          value={code}
                          onChange={(value) => setCode(value.toUpperCase())}
                          disabled={isLoading}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} className="w-12 h-14 text-xl font-mono uppercase" />
                            <InputOTPSlot index={1} className="w-12 h-14 text-xl font-mono uppercase" />
                            <InputOTPSlot index={2} className="w-12 h-14 text-xl font-mono uppercase" />
                            <InputOTPSlot index={3} className="w-12 h-14 text-xl font-mono uppercase" />
                            <InputOTPSlot index={4} className="w-12 h-14 text-xl font-mono uppercase" />
                            <InputOTPSlot index={5} className="w-12 h-14 text-xl font-mono uppercase" />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      {errors.code && (
                        <p className="text-sm text-destructive text-center">{errors.code}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full glow-red-subtle"
                      disabled={isLoading || code.length !== 6}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Vérification...
                        </>
                      ) : (
                        <>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Se connecter
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Le code expire dans 10 minutes
                    </p>
                  </form>
                )}
              </TabsContent>

              {/* ==================== REGISTER TAB ==================== */}
              <TabsContent value="register" className="mt-0">
                {signupStep === 'form' ? (
                  <form onSubmit={handleRequestSignupCode} className="space-y-4">
                    <CardTitle className="text-xl">Inscription</CardTitle>
                    <CardDescription>
                      Créez un compte pour sauvegarder vos données
                    </CardDescription>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="register-firstname">Prénom</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="register-firstname"
                            type="text"
                            placeholder="Jean"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="pl-10"
                            disabled={isLoading}
                          />
                        </div>
                        {errors.firstName && (
                          <p className="text-sm text-destructive">{errors.firstName}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-lastname">Nom</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="register-lastname"
                            type="text"
                            placeholder="Dupont"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="pl-10"
                            disabled={isLoading}
                          />
                        </div>
                        {errors.lastName && (
                          <p className="text-sm text-destructive">{errors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="votre@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full glow-red-subtle"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Envoi du code...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Recevoir le code de vérification
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifySignupCode} className="space-y-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetSignup}
                      className="mb-2 -ml-2"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Retour
                    </Button>
                    
                    <CardTitle className="text-xl">Vérification</CardTitle>
                    <CardDescription>
                      Entrez le code à 6 caractères reçu par email à <span className="font-medium text-primary">{email}</span>
                    </CardDescription>

                    <div className="space-y-4 pt-2">
                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          value={code}
                          onChange={(value) => setCode(value.toUpperCase())}
                          disabled={isLoading}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} className="w-12 h-14 text-xl font-mono uppercase" />
                            <InputOTPSlot index={1} className="w-12 h-14 text-xl font-mono uppercase" />
                            <InputOTPSlot index={2} className="w-12 h-14 text-xl font-mono uppercase" />
                            <InputOTPSlot index={3} className="w-12 h-14 text-xl font-mono uppercase" />
                            <InputOTPSlot index={4} className="w-12 h-14 text-xl font-mono uppercase" />
                            <InputOTPSlot index={5} className="w-12 h-14 text-xl font-mono uppercase" />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      {errors.code && (
                        <p className="text-sm text-destructive text-center">{errors.code}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full glow-red-subtle"
                      disabled={isLoading || code.length !== 6}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Création du compte...
                        </>
                      ) : (
                        <>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Créer mon compte
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Le code expire dans 10 minutes
                    </p>
                  </form>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
