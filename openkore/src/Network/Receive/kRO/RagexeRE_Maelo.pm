# MaeloRO: kRO_RagexeRE_0 + 0AC4 account_server_info (server replies with it to 0064 login)
package Network::Receive::kRO::RagexeRE_Maelo;
use strict;
use base qw(Network::Receive::kRO::RagexeRE_0);

sub new {
	my ($class) = @_;
	my $self = $class->SUPER::new(@_);
	my %packets = (
		'0AC4' => ['account_server_info', 'v a4 a4 a4 a4 a26 C x17 a*', [qw(len sessionID accountID sessionID2 lastLoginIP lastLoginTime accountSex serverInfo)]],
		'09A0' => ['sync_received_characters', 'V', [qw(sync_Count)]],
		'020D' => ['sync_received_characters', 'v', []], # MaeloRO uses 0x020D (len 4) as charlist notify
	);
	$self->{packet_list}{$_} = $packets{$_} for keys %packets;
	return $self;
}

1;
