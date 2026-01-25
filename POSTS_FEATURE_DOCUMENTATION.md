# Community Posts & Blogs Feature

## Overview
A social media-style posts/blogs feature similar to LinkedIn and Facebook has been added to the platform. This allows all users (students, employers) to create, share, and engage with posts in a community feed.

## Features Implemented

### 1. Backend API (Posts Module)

#### Location
- **Controller**: `backend/src/modules/posts/postController.js`
- **Routes**: `backend/src/modules/posts/postRoutes.js`
- **Model**: `backend/src/models/Post.js` (already existed)

#### API Endpoints

##### Public & Feed Endpoints
- `GET /api/posts/feed` - Get personalized feed with pagination and filters
  - Query params: `page`, `limit`, `postType`, `search`
  - Returns posts from followed users and public posts
  
- `GET /api/posts/:id` - Get single post with full details
  - Increments view count
  - Includes author info, comments, likes

- `GET /api/posts/user/:userId` - Get all posts by a specific user

- `GET /api/posts/my/posts` - Get current user's posts

##### Post Management
- `POST /api/posts` - Create a new post
  - Body: `content`, `postType`, `media`, `visibility`, `relatedJob`, `relatedCourse`
  - Post types: `general`, `job-achievement`, `course-completion`, `project-showcase`, `article-share`
  - Visibility: `public`, `connections`, `private`

- `PUT /api/posts/:id` - Update own post
  - Only author can update

- `DELETE /api/posts/:id` - Delete post
  - Author or admin can delete

##### Engagement
- `POST /api/posts/:id/like` - Like/Unlike a post (toggle)
  - Returns like count and current like status

- `POST /api/posts/:id/comment` - Add comment to post
  - Body: `content` (max 1000 characters)
  - Returns the new comment with populated user info

- `DELETE /api/posts/:id/comment/:commentId` - Delete a comment
  - Comment author or post author can delete

- `POST /api/posts/:id/report` - Report a post
  - Body: `reason`
  - Marks post as reported for admin review

### 2. Frontend Pages

#### Main Feed Page
**Location**: `frontend/src/app/posts/page.js`

Features:
- Personalized feed showing posts from followed users and public posts
- Filter by post type (all, general, job-achievement, course-completion, project-showcase)
- Create new post modal with:
  - Content textarea (max 5000 characters)
  - Post type selection
  - Visibility settings
- Post cards showing:
  - Author info with profile photo/logo
  - Post content
  - Post type and visibility badges
  - Engagement stats (likes, comments, views)
  - Like, comment, and view buttons
- Inline commenting with expandable comment section
- Infinite scroll with "Load More" button
- Real-time like/comment updates

#### Individual Post Page
**Location**: `frontend/src/app/posts/[id]/page.js`

Features:
- Full post details with author information
- Complete comments section
- Add new comments
- Delete comments (author/post owner)
- Like/unlike functionality
- Related job/course display
- View count tracking
- Back navigation

#### Admin Posts Management
**Location**: `frontend/src/app/admin/posts/page.js`

Features:
- Two tabs: "All Posts" and "Reported Posts"
- List all posts with management options
- View reported posts with report details
- Actions available:
  - View post
  - Hide/Unhide post
  - Delete post
- Post stats display (likes, comments, views, reports)
- Pagination for all posts

### 3. Dashboard Integration

#### Student Dashboard
**Location**: `frontend/src/app/student/dashboard/page.js`

Changes:
- Added 5th stat card showing "Community Blogs" link
- Added "Community Blogs" quick action card with orange gradient
- Direct navigation to `/posts`

#### Employer Dashboard
**Location**: `frontend/src/app/employer/dashboard/page.js`

Changes:
- Added 4th quick action card for "Community Blogs"
- Orange gradient styling to highlight the new feature
- Direct navigation to `/posts`

#### Admin Dashboard
**Location**: `frontend/src/app/admin/dashboard/page.js`

Changes:
- Added "Manage Posts" quick action card
- Links to new admin posts management page
- Orange gradient styling

## Post Model Schema

```javascript
{
  author: ObjectId (User),
  content: String (required, max 5000 chars),
  media: [{ type, url, thumbnail }],
  postType: Enum ['general', 'job-achievement', 'course-completion', 'project-showcase', 'article-share'],
  relatedJob: ObjectId (Job),
  relatedCourse: ObjectId (Course),
  
  // Engagement
  likes: [{ user, likedAt }],
  comments: [{ user, content, createdAt }],
  shares: [{ user, sharedAt }],
  
  // Visibility & Moderation
  visibility: Enum ['public', 'connections', 'private'],
  isReported: Boolean,
  reports: [{ reportedBy, reason, reportedAt }],
  isHidden: Boolean,
  views: Number,
  
  timestamps: true
}
```

## User Flow

### Creating a Post
1. Navigate to `/posts` from dashboard
2. Click "Share something with the community..." button
3. Fill in the create post modal:
   - Select post type
   - Choose visibility
   - Write content (up to 5000 characters)
4. Click "Post" to publish
5. Post appears at the top of the feed

### Engaging with Posts
1. **Liking**: Click the "Like" button on any post (toggles on/off)
2. **Commenting**: 
   - Click "Comment" to expand comment section
   - Type comment in textarea
   - Click "Comment" button to submit
3. **Viewing**: Click "View" or post content to see full post details

### Admin Moderation
1. Navigate to "Manage Posts" from admin dashboard
2. Switch between "All Posts" and "Reported Posts" tabs
3. For any post:
   - View full details
   - Hide/unhide from public view
   - Delete permanently
4. Reported posts show:
   - All report reasons
   - Report timestamps
   - Reporter information

## Security & Permissions

### Authentication Required
- All post operations require authentication
- Create, update, delete require valid user token

### Authorization Rules
- **Create**: Any authenticated user (student, employer)
- **Update**: Only post author
- **Delete**: Post author or admin
- **Like/Comment**: Any authenticated user
- **Hide/Moderate**: Admin only
- **Delete Comment**: Comment author or post author

### Validation
- Content: Required, 1-5000 characters
- Post type: Must be valid enum value
- Visibility: Must be valid enum value
- Comment: Required, 1-1000 characters

## Technical Details

### Backend Dependencies
- Express.js for routing
- Mongoose for MongoDB operations
- express-validator for input validation
- asyncHandler for error handling

### Frontend Dependencies
- Next.js 14 (App Router)
- React hooks (useState, useEffect)
- Tailwind CSS for styling
- js-cookie for auth management
- Custom API service

### Database Indexes
```javascript
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ postType: 1 });
postSchema.index({ content: 'text' });
```

## Future Enhancements

### Potential Features
1. **Media Uploads**: Image/video support for posts
2. **Post Sharing**: Share posts with others
3. **Hashtags**: Add hashtag support for better discovery
4. **Mentions**: Tag other users in posts/comments
5. **Rich Text Editor**: Formatting options for posts
6. **Notifications**: Real-time notifications for likes/comments
7. **Advanced Search**: Search posts by keywords, tags, or users
8. **Post Analytics**: View insights on post performance
9. **Save Posts**: Bookmark posts for later
10. **Follow System**: Follow users and see their posts prioritized

### Performance Optimizations
1. Implement infinite scroll instead of pagination
2. Add caching for frequently accessed posts
3. Optimize queries with proper projections
4. Implement CDN for media content
5. Add rate limiting for post creation

## Testing Recommendations

### API Testing
```bash
# Get feed
GET /api/posts/feed?page=1&limit=10&postType=general

# Create post
POST /api/posts
Body: { "content": "Hello world!", "postType": "general", "visibility": "public" }

# Like post
POST /api/posts/:postId/like

# Add comment
POST /api/posts/:postId/comment
Body: { "content": "Great post!" }

# Report post
POST /api/posts/:postId/report
Body: { "reason": "Inappropriate content" }
```

### Frontend Testing
1. Test post creation with various content lengths
2. Verify like toggle functionality
3. Test comment addition and deletion
4. Check pagination and filtering
5. Verify admin moderation features
6. Test responsive design on mobile devices

## Deployment Notes

### Environment Variables
No new environment variables required. Uses existing:
- `FRONTEND_URL` - For CORS
- `JWT_SECRET` - For authentication
- `MONGODB_URI` - Database connection

### Database Migration
No migration needed. Post model already exists in the schema.

### Server Updates
The posts routes have been added to `backend/src/server.js`:
```javascript
app.use('/api/posts', require('./modules/posts/postRoutes'));
```

## Support & Maintenance

### Monitoring
- Track post creation rates
- Monitor reported posts queue
- Check engagement metrics (likes, comments)
- Monitor API response times

### Common Issues
1. **Posts not showing**: Check authentication token
2. **Can't like/comment**: Verify user is logged in
3. **Feed not loading**: Check pagination parameters
4. **Admin can't access**: Verify admin role

## Conclusion

The Community Posts & Blogs feature is now fully integrated into the platform, providing a social networking layer that connects students and employers. Users can share achievements, insights, and engage with the community in a LinkedIn-style feed.

This feature enhances the platform by:
- Increasing user engagement
- Building community connections
- Showcasing student achievements
- Enabling employer branding
- Providing valuable content for all users
