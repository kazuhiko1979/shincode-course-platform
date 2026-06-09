'use client'

import GoogleOAuthButton from '@/components/GoogleOAuthButton'

export default function GoogleLoginButton({
  next,
  enroll,
}: {
  next?: string
  enroll?: string
}) {
  return <GoogleOAuthButton next={next} enroll={enroll} label="Google で続ける" />
}
