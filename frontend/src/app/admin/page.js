<main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Categories (Desktop Only) */}
          <aside className="hidden lg:block lg:w-64 shrink-0">
            <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm sticky top-24">
              <h3 className="font-semibold text-foreground mb-3">หมวดหมู่</h3>
              {/* Category Search - Desktop */}
              <div className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="ค้นหาหมวดหมู่..."
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              </div>
              <nav className="space-y-1 max-h-[50vh] overflow-y-auto">
                {filteredCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">ไม่พบหมวดหมู่</p>
                ) : (
                  filteredCategories.map((cat) => {
                    const Icon = getCategoryIcon(cat.icon);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          setCategorySearchQuery("");
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          selectedCategory === cat.name
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon 
                          className="w-4 h-4" 
                          style={{ color: selectedCategory !== cat.name ? getColorValue(cat.color) : undefined }}
                        />
                        <span>{cat.name}</span>
                      </button>
                    );
                  })
                )}
              </nav>

              {/* Login CTA for guests */}
              {!user && (
                <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <h4 className="font-medium text-foreground mb-2">เข้าร่วมชุมชน</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    เข้าสู่ระบบเพื่อสร้างกระทู้ ไลค์ และแสดงความคิดเห็น
                  </p>
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    เข้าสู่ระบบ
                  </Link>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content - Posts */}
          <div className="flex-1 space-y-4">
            {/* Stats Banner */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {user ? `สวัสดี, ${userProfile.display_name || user.email?.split("@")[0]}!` : "ยินดีต้อนรับสู่ TalkBoard!"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {user ? `มี ${filteredPosts.length} กระทู้รอคุณอยู่` : "เข้าสู่ระบบเพื่อร่วมแบ่งปันเรื่องราว"}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-foreground">1,234</div>
                    <div className="text-muted-foreground text-xs">สมาชิก</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-foreground">567</div>
                    <div className="text-muted-foreground text-xs">กระทู้ใหม่</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Notice Banner */}
            {!user && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">คุณกำลังเรียกดูในโหมดผู้เยี่ยมชม</p>
                    <p className="text-sm text-muted-foreground">เข้าสู่ระบบเพื่อสร้างกระทู้ ไลค์ และแสดงความคิดเห็น</p>
                  </div>
                </div>
                <Link
                  to="/login"
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                >
                  เข้าสู่ระบบ
                </Link>
              </div>
            )}

            {/* Sort Options */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ArrowUpDown className="w-4 h-4" />
                <span>เรียงตาม:</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {sortOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        sortBy === option.value
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Posts List */}
            {isLoadingPosts ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPosts.map((post, index) => (
                  <Link
                    to={`/post/${post.id}`}
                    key={post.id}
                    className="group block bg-card border border-border/50 rounded-2xl p-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <div className="shrink-0">
                        {post.avatar ? (
                          <img
                            src={post.avatar}
                            alt={post.author}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                            {post.author[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {post.isPinned && (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 text-xs font-medium rounded-full">
                              📌 ปักหมุด
                            </span>
                          )}
                          {post.isHot && (
                            <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs font-medium rounded-full">
                              🔥 มาแรง
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs font-medium rounded-full">
                            {post.category}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          {post.timeAgo}
                        </span>
                      </div>

                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
                        {post.title}
                      </h3>

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{post.author}</span>
                          {post.isAuthorAdmin ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 text-amber-600 text-xs font-medium rounded-full">
                              <Shield className="w-3 h-3" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 text-blue-600 text-xs font-medium rounded-full">
                              <User className="w-3 h-3" />
                              User
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <button
                            onClick={(e) => handleLike(e, post.id)}
                            disabled={likingPostId === post.id}
                            className={`flex items-center gap-1 transition-all hover:scale-110 ${
                              userLikes.has(post.id)
                                ? "text-primary font-medium"
                                : "hover:text-primary"
                            } ${likingPostId === post.id ? "opacity-50" : ""}`}
                          >
                            <ThumbsUp
                              className={`w-4 h-4 ${userLikes.has(post.id) ? "fill-primary" : ""}`}
                            />
                            {post.likes}
                          </button>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {post.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {post.views.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="hidden sm:flex items-center">
                      <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
                ))}
              </div>
            )}

            {!isLoadingPosts && filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">ไม่พบกระทู้ที่ค้นหา</p>
              </div>
            )}
          </div>
        </div>
      </main>