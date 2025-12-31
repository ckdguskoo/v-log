package com.likelion.vlog.service;

import com.likelion.vlog.dto.auth.SignupRequest;
import com.likelion.vlog.dto.comments.CommentCreatePostRequest;
import com.likelion.vlog.dto.comments.ReplyCreatePostRequest;
import com.likelion.vlog.dto.posts.PostCreatePostRequest;
import com.likelion.vlog.dto.posts.PostGetResponse;
import com.likelion.vlog.entity.User;
import com.likelion.vlog.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 회원 탈퇴 통합 테스트
 * - 회원가입 → 게시글 작성 → 댓글 작성 → 답글 작성 → 좋아요 → 팔로우 → 회원 탈퇴
 * - 회원 탈퇴 시 모든 연관 데이터가 삭제되는지 확인
 */
@SpringBootTest
@Transactional
@ActiveProfiles("test")
class UserDeletionIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private PostService postService;

    @Autowired
    private CommentService commentService;

    @Autowired
    private LikeService likeService;

    @Autowired
    private UserService userService;

    @Autowired
    private FollowService followService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BlogRepository blogRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private TagMapRepository tagMapRepository;

    @Autowired
    private FollowRepository followRepository;

    private String userEmail;
    private String userPassword;
    private String otherUserEmail;

    @BeforeEach
    void setUp() {
        userEmail = "user@test.com";
        userPassword = "password123";
        otherUserEmail = "other@test.com";
    }

    @Test
    @DisplayName("회원 탈퇴 시 사용자가 작성한 모든 데이터가 삭제된다")
    void deleteUser_shouldDeleteAllUserData() {
        // Given: 회원가입
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setEmail(userEmail);
        signupRequest.setPassword(userPassword);
        signupRequest.setNickname("테스터");
        authService.signup(signupRequest);

        User user = userRepository.findByEmail(userEmail).orElseThrow();
        Long userId = user.getId();

        // Given: 게시글 작성 (태그 포함)
        PostCreatePostRequest postRequest = new PostCreatePostRequest();
        postRequest.setTitle("테스트 게시글");
        postRequest.setContent("테스트 내용입니다.");
        postRequest.setTags(List.of("자바", "스프링", "테스트"));

        PostGetResponse post = postService.createPost(postRequest, userEmail);
        Long postId = post.getPostId();

        // Given: 댓글 작성
        CommentCreatePostRequest commentRequest = new CommentCreatePostRequest();
        commentRequest.setContent("댓글 내용입니다.");

        var commentResponse = commentService.createComment(postId, commentRequest, userEmail);
        Long commentId = commentResponse.getCommentId();

        // Given: 답글 작성
        ReplyCreatePostRequest replyRequest = new ReplyCreatePostRequest();
        replyRequest.setContent("답글 내용입니다.");

        commentService.createReply(postId, commentId, replyRequest, userEmail);

        // Given: 좋아요
        likeService.addLike(userEmail, postId);

        // Given: 데이터 존재 확인
        assertThat(userRepository.findById(userId)).isPresent();
        assertThat(postRepository.findById(postId)).isPresent();
        assertThat(commentRepository.findById(commentId)).isPresent();
        assertThat(likeRepository.countByPostId(postId)).isEqualTo(1);
        assertThat(tagMapRepository.findAllByPost(postRepository.findById(postId).get())).hasSize(3);

        // When: 회원 탈퇴
        userService.deleteUser(userId, userPassword);

        // Then: User가 삭제되었는지 확인
        assertThat(userRepository.findById(userId)).isEmpty();

        // Then: Blog가 삭제되었는지 확인 (cascade)
        assertThat(blogRepository.findByUser(user)).isEmpty();

        // Then: Post가 삭제되었는지 확인
        assertThat(postRepository.findById(postId)).isEmpty();

        // Then: Comment가 삭제되었는지 확인
        assertThat(commentRepository.findById(commentId)).isEmpty();

        // Then: Like가 삭제되었는지 확인
        assertThat(likeRepository.countByPostId(postId)).isEqualTo(0);
    }

    @Test
    @DisplayName("회원 탈퇴 시 다른 사용자 게시글에 작성한 댓글과 좋아요도 삭제된다")
    void deleteUser_shouldDeleteCommentsAndLikesOnOtherUsersPosts() {
        // Given: 게시글 작성자 회원가입
        SignupRequest authorSignup = new SignupRequest();
        authorSignup.setEmail(otherUserEmail);
        authorSignup.setPassword("password123");
        authorSignup.setNickname("작성자");
        authService.signup(authorSignup);

        // Given: 댓글/좋아요 작성자 회원가입
        SignupRequest commenterSignup = new SignupRequest();
        commenterSignup.setEmail(userEmail);
        commenterSignup.setPassword(userPassword);
        commenterSignup.setNickname("댓글러");
        authService.signup(commenterSignup);

        User commenter = userRepository.findByEmail(userEmail).orElseThrow();
        Long commenterId = commenter.getId();

        // Given: 다른 사용자의 게시글
        PostCreatePostRequest postRequest = new PostCreatePostRequest();
        postRequest.setTitle("다른 사용자의 게시글");
        postRequest.setContent("내용");
        postRequest.setTags(List.of("테스트"));

        PostGetResponse post = postService.createPost(postRequest, otherUserEmail);
        Long postId = post.getPostId();

        // Given: 댓글 작성
        CommentCreatePostRequest commentRequest = new CommentCreatePostRequest();
        commentRequest.setContent("내가 작성한 댓글");

        var comment = commentService.createComment(postId, commentRequest, userEmail);
        Long commentId = comment.getCommentId();

        // Given: 좋아요
        likeService.addLike(userEmail, postId);

        // Given: 데이터 존재 확인
        assertThat(commentRepository.findById(commentId)).isPresent();
        assertThat(likeRepository.existsByUserIdAndPostId(commenterId, postId)).isTrue();

        // When: 댓글/좋아요 작성자가 탈퇴
        userService.deleteUser(commenterId, userPassword);

        // Then: 사용자가 삭제되었는지 확인
        assertThat(userRepository.findById(commenterId)).isEmpty();

        // Then: 다른 사용자의 게시글에 작성한 댓글이 삭제되었는지 확인
        assertThat(commentRepository.findById(commentId)).isEmpty();

        // Then: 다른 사용자의 게시글에 누른 좋아요가 삭제되었는지 확인
        assertThat(likeRepository.existsByUserIdAndPostId(commenterId, postId)).isFalse();

        // Then: 다른 사용자의 게시글은 삭제되지 않았는지 확인
        assertThat(postRepository.findById(postId)).isPresent();
    }

    @Test
    @DisplayName("회원 탈퇴 시 팔로우 관계도 모두 삭제된다")
    void deleteUser_shouldDeleteFollowRelationships() {
        // Given: 사용자1 회원가입
        SignupRequest user1Signup = new SignupRequest();
        user1Signup.setEmail(userEmail);
        user1Signup.setPassword(userPassword);
        user1Signup.setNickname("사용자1");
        authService.signup(user1Signup);

        User user1 = userRepository.findByEmail(userEmail).orElseThrow();
        Long user1Id = user1.getId();

        // Given: 사용자2 회원가입
        SignupRequest user2Signup = new SignupRequest();
        user2Signup.setEmail(otherUserEmail);
        user2Signup.setPassword("password123");
        user2Signup.setNickname("사용자2");
        authService.signup(user2Signup);

        User user2 = userRepository.findByEmail(otherUserEmail).orElseThrow();
        Long user2Id = user2.getId();

        // Given: 사용자1이 사용자2를 팔로우
        followService.follow(user2Id, userEmail);

        // Given: 사용자2가 사용자1을 팔로우
        followService.follow(user1Id, otherUserEmail);

        // Given: 팔로우 관계 확인
        assertThat(followRepository.existsByFollowerAndFollowing(user1, user2)).isTrue();
        assertThat(followRepository.existsByFollowerAndFollowing(user2, user1)).isTrue();

        // When: 사용자1 탈퇴
        userService.deleteUser(user1Id, userPassword);

        // Then: 사용자1이 삭제되었는지 확인
        assertThat(userRepository.findById(user1Id)).isEmpty();

        // Then: 사용자1이 팔로우한 관계가 삭제되었는지 확인 (follower = user1)
        // user1이 삭제되어 조회 불가능하므로 count로 확인
        assertThat(followRepository.findAll()).noneMatch(f -> f.getFollower().getId().equals(user1Id));

        // Then: 사용자1을 팔로우한 관계가 삭제되었는지 확인 (following = user1)
        assertThat(followRepository.findAll()).noneMatch(f -> f.getFollowing().getId().equals(user1Id));

        // Then: 사용자2는 삭제되지 않았는지 확인
        assertThat(userRepository.findById(user2Id)).isPresent();
    }

    @Test
    @DisplayName("회원 탈퇴 시 자신의 게시글에 달린 다른 사용자의 댓글도 삭제된다")
    void deleteUser_shouldDeleteOtherUsersCommentsOnOwnPosts() {
        // Given: 게시글 작성자 회원가입
        SignupRequest authorSignup = new SignupRequest();
        authorSignup.setEmail(userEmail);
        authorSignup.setPassword(userPassword);
        authorSignup.setNickname("작성자");
        authService.signup(authorSignup);

        User author = userRepository.findByEmail(userEmail).orElseThrow();
        Long authorId = author.getId();

        // Given: 댓글 작성자 회원가입
        SignupRequest commenterSignup = new SignupRequest();
        commenterSignup.setEmail(otherUserEmail);
        commenterSignup.setPassword("password123");
        commenterSignup.setNickname("댓글러");
        authService.signup(commenterSignup);

        // Given: 게시글 작성
        PostCreatePostRequest postRequest = new PostCreatePostRequest();
        postRequest.setTitle("내 게시글");
        postRequest.setContent("내용");
        postRequest.setTags(List.of("테스트"));

        PostGetResponse post = postService.createPost(postRequest, userEmail);
        Long postId = post.getPostId();

        // Given: 다른 사용자가 댓글 작성
        CommentCreatePostRequest commentRequest = new CommentCreatePostRequest();
        commentRequest.setContent("다른 사용자의 댓글");

        var comment = commentService.createComment(postId, commentRequest, otherUserEmail);
        Long commentId = comment.getCommentId();

        // Given: 다른 사용자가 좋아요
        likeService.addLike(otherUserEmail, postId);

        // When: 게시글 작성자(author) 탈퇴
        userService.deleteUser(authorId, userPassword);

        // Then: 작성자가 삭제되었는지 확인
        assertThat(userRepository.findById(authorId)).isEmpty();

        // Then: 게시글이 삭제되었는지 확인
        assertThat(postRepository.findById(postId)).isEmpty();

        // Then: 다른 사용자가 작성한 댓글도 함께 삭제되었는지 확인
        assertThat(commentRepository.findById(commentId)).isEmpty();

        // Then: 다른 사용자가 누른 좋아요도 함께 삭제되었는지 확인
        assertThat(likeRepository.countByPostId(postId)).isEqualTo(0);

        // Then: 댓글 작성자는 삭제되지 않았는지 확인
        assertThat(userRepository.findByEmail(otherUserEmail)).isPresent();
    }
}