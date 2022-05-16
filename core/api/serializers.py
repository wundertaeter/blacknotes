from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth.models import User


class HasuraTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['user_name'] = user.username
        token['https://hasura.io/jwt/claims'] = {}
        token['https://hasura.io/jwt/claims']['x-hasura-default-role'] = 'user'
        token['https://hasura.io/jwt/claims']['x-hasura-allowed-roles'] = ['admin', 'user']
        if user.is_superuser:
            token['https://hasura.io/jwt/claims']['x-hasura-role'] = 'admin'
        else:
            token['https://hasura.io/jwt/claims']['x-hasura-role'] = 'user'
        token['https://hasura.io/jwt/claims']['x-hasura-user-id'] = str(user.id)

        return token

class UserSerializer(serializers.ModelSerializer):

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email']
        )
        user.set_password(validated_data['password'])
        user.save()

        return user

    class Meta:
        model = User
        # Tuple of serialized model fields (see link [2])
        fields = ('username', 'password', 'email')