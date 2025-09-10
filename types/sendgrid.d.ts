declare module "@sendgrid/mail" {
  const sgMail: {
    setApiKey: (key: string) => void;
    send: (msg: unknown) => Promise<any[]>;
  };
  export default sgMail;
}
