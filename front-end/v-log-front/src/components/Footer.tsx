const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-auto py-8">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-serif font-bold text-foreground text-lg mb-1">vlog.</p>
            <p>© 2024 vlog. All rights reserved.</p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>개발자 블로그 플랫폼</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

